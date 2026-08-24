import { Octokit } from '@octokit/rest';
import OpenAI from 'openai';

const aiClient = new OpenAI({
  apiKey: process.env.LLM_API_KEY || '',
  baseURL: process.env.LLM_BASE_URL || 'https://integrate.api.nvidia.com/v1',
});

export interface AutoFixResult {
  success: boolean;
  reason?: string;
  prUrl?: string;
  prNumber?: number;
  fixesApplied: Array<{ type: string; fix: string; file?: string; files?: string[]; impact: string }>;
  estimatedGain: number;
  branchName?: string;
}

/** Normalize any issue shape to a common matcher */
function matchField(issue: any): string {
  // Web audit uses `issue`, GitHub audit uses `title`
  return (issue.issue || issue.title || issue.fixSuggestion || '').toLowerCase();
}

function matchFile(issue: any): string | undefined {
  return issue.file || issue.filePath || issue.location || undefined;
}

function matchCategory(issue: any): string {
  return (issue.category || issue.type || '').toLowerCase();
}

// ─── GitHub code-level auto-fix patterns ───
interface CodeFixPattern {
  pattern: RegExp;
  matchTitle?: RegExp;     // match against issue title
  matchCategory?: string;  // match against category
  description: string;
  replacement: (fullMatch: string, ...groups: string[]) => string;
  impact: string;
  type: string;
}

const CODE_FIXES: CodeFixPattern[] = [
  // eval() → throw error
  {
    pattern: /eval\s*\([^)]*\)/g,
    matchTitle: /eval/,
    matchCategory: 'security',
    description: 'Removed eval() call (security risk)',
    replacement: () => '/* [AuditIQ] eval() removed — use JSON.parse() or safe alternative */',
    impact: '+10 Security',
    type: 'Security',
  },
  // innerHTML = → textContent =
  {
    pattern: /\.innerHTML\s*=/g,
    matchTitle: /inner\s*html|xss/i,
    matchCategory: 'security',
    description: 'Changed innerHTML to textContent (XSS prevention)',
    replacement: (match) => match.replace('innerHTML', 'textContent'),
    impact: '+10 Security',
    type: 'Security',
  },
  // document.write → console.warn
  {
    pattern: /document\.write\s*\([^)]*\)/g,
    matchTitle: /document\.write/i,
    matchCategory: 'security',
    description: 'Replaced document.write() with safe alternative',
    replacement: () => '/* [AuditIQ] document.write() removed — use DOM methods */',
    impact: '+8 Security',
    type: 'Security',
  },
  // new Function → throw
  {
    pattern: /new\s+Function\s*\([^)]*\)/g,
    matchTitle: /function\s*constructor|dynamic.*function/i,
    matchCategory: 'security',
    description: 'Removed dynamic Function constructor (security risk)',
    replacement: () => '/* [AuditIQ] Dynamic Function constructor removed */',
    impact: '+8 Security',
    type: 'Security',
  },
  // console.log/debug/info → remove or comment out
  {
    pattern: /console\.(?:log|debug|info)\s*\([^)]*\);?\s*\n?/g,
    matchTitle: /console\.(log|debug|info)/i,
    matchCategory: 'quality',
    description: 'Removed console.log statements',
    replacement: () => '',
    impact: '+5 Quality',
    type: 'Quality',
  },
  // == → === (but not ===, !==, ==)
  {
    pattern: /(?<!=)==(?!=)/g,
    matchTitle: /loose\s*equality|==\s*instead/i,
    matchCategory: 'bug',
    description: 'Changed == to === (strict equality)',
    replacement: () => '===',
    impact: '+5 Quality',
    type: 'Bug Fix',
  },
  // var → const (basic)
  {
    pattern: /\bvar\s+(\w+)\s*=/g,
    matchTitle: /\bvar\b.*keyword|use.*const/i,
    matchCategory: 'quality',
    description: 'Changed var to const',
    replacement: (match, varName) => match.replace(/\bvar\b/, 'const'),
    impact: '+3 Quality',
    type: 'Quality',
  },
  // Empty catch block
  {
    pattern: /catch\s*\(\s*\w*\s*\)\s*\{\s*\}/g,
    matchTitle: /empty\s*catch/i,
    matchCategory: 'bug',
    description: 'Added error logging to empty catch block',
    replacement: (match) => {
      const varName = match.match(/catch\s*\(\s*(\w*)/)?.[1] || 'e';
      return `catch (${varName}) { console.error('[AuditIQ] Caught error:', ${varName}); }`;
    },
    impact: '+5 Quality',
    type: 'Bug Fix',
  },
  // setTimeout with string
  {
    pattern: /setTimeout\s*\(\s*["'][^"']+["']/g,
    matchTitle: /settimeout.*string/i,
    matchCategory: 'security',
    description: 'Removed string argument setTimeout (security risk)',
    replacement: () => '/* [AuditIQ] setTimeout with string removed — use function reference */',
    impact: '+8 Security',
    type: 'Security',
  },
  // HTTP URLs → HTTPS
  {
    pattern: /["']http:\/\/(?!localhost|127\.0\.0\.1|0\.0\.0\.0)/g,
    matchTitle: /insecure\s*http|http.*https/i,
    matchCategory: 'security',
    description: 'Upgraded HTTP to HTTPS',
    replacement: (match) => match.replace('http://', 'https://'),
    impact: '+5 Security',
    type: 'Security',
  },
];

export async function createAutoFixPR({
  githubToken,
  repoOwner,
  repoName,
  auditResults,
  issues,
}: {
  githubToken: string;
  repoOwner: string;
  repoName: string;
  auditResults: any;
  issues: any[];
}): Promise<AutoFixResult> {
  const octokit = new Octokit({ auth: githubToken });
  const fixesApplied: AutoFixResult['fixesApplied'] = [];
  const fileChanges = new Map<string, string>();

  // Get repo default branch
  const { data: repo } = await octokit.repos.get({ owner: repoOwner, repo: repoName });
  const defaultBranch = repo.default_branch;

  // Get current commit SHA
  const { data: ref } = await octokit.git.getRef({
    owner: repoOwner,
    repo: repoName,
    ref: `heads/${defaultBranch}`,
  });
  const baseSha = ref.object.sha;

  // ═══════════════════════════════════════════════════
  // PHASE 1: Code-level fixes (GitHub audit issues)
  // ═══════════════════════════════════════════════════
  // Group issues by file
  const issuesByFile = new Map<string, any[]>();
  for (const issue of issues) {
    const filePath = matchFile(issue);
    if (filePath && issue.fixedCode) {
      // These have explicit fixed code from the analyzer
      if (!issuesByFile.has(filePath)) issuesByFile.set(filePath, []);
      issuesByFile.get(filePath)!.push(issue);
    }
  }

  // Apply explicit fixedCode suggestions
  for (const [filePath, fileIssues] of issuesByFile) {
    let content = fileChanges.get(filePath) ?? (await getFileContent(octokit, repoOwner, repoName, filePath));
    if (!content) continue;

    let changed = false;
    for (const issue of fileIssues) {
      if (issue.fixedCode && issue.codeSnippet) {
        // Try to find and replace the snippet
        const snippet = issue.codeSnippet.trim();
        const fixed = issue.fixedCode.trim();
        if (content.includes(snippet) && fixed) {
          content = content.replace(snippet, fixed);
          changed = true;
        }
      }
    }

    if (changed) {
      fileChanges.set(filePath, content);
      fixesApplied.push({
        type: 'Code Fix',
        fix: `Applied ${fileIssues.length} code fix${fileIssues.length > 1 ? 'es' : ''} in ${filePath}`,
        file: filePath,
        impact: `+${fileIssues.length * 5} Code Quality`,
      });
    }
  }

  // ═══════════════════════════════════════════════════
  // PHASE 2: Pattern-based code fixes
  // ═══════════════════════════════════════════════════
  // Find all source files that have matching issues
  const sourceFiles = await findFiles(octokit, repoOwner, repoName, [
    '.js', '.ts', '.jsx', '.tsx', '.vue', '.svelte',
  ]);

  for (const filePath of sourceFiles) {
    const rawContent = fileChanges.get(filePath) ?? (await getFileContent(octokit, repoOwner, repoName, filePath));
    if (!rawContent) continue;
    let content: string = rawContent;

    let totalReplacements = 0;
    const appliedFixes: string[] = [];

    for (const fixPattern of CODE_FIXES) {
      // Check if this pattern matches any of the reported issues
      const matchingIssue = issues.find((i) => {
        const title = matchField(i);
        const cat = matchCategory(i);
        if (fixPattern.matchTitle && fixPattern.matchTitle.test(title)) return true;
        if (fixPattern.matchCategory && cat.includes(fixPattern.matchCategory)) return true;
        return false;
      });

      if (!matchingIssue) continue;

      // Apply the fix pattern to the file
      fixPattern.pattern.lastIndex = 0;
      const replaced: string = content.replace(fixPattern.pattern, (match: string, ...rest: string[]) => {
        totalReplacements++;
        return fixPattern.replacement(match, ...rest);
      });

      if (replaced !== content) {
        content = replaced;
        if (!appliedFixes.includes(fixPattern.description)) {
          appliedFixes.push(fixPattern.description);
        }
      }
    }

    if (totalReplacements > 0) {
      fileChanges.set(filePath, content);
      fixesApplied.push({
        type: 'Code Fix',
        fix: `${totalReplacements} fixes in ${filePath}: ${appliedFixes.join('; ')}`,
        file: filePath,
        impact: `+${totalReplacements * 3} Code Quality`,
      });
    }
  }

  // ═══════════════════════════════════════════════════
  // PHASE 3: Web-audit-style fixes (for repos with HTML/config)
  // ═══════════════════════════════════════════════════
  const allText = issues.map(i => matchField(i)).join(' ') + ' ' + issues.map(i => matchCategory(i)).join(' ');

  // Fix: Missing meta description
  if (/meta\s*description/i.test(allText)) {
    const htmlFiles = await findFiles(octokit, repoOwner, repoName, ['.html']);
    for (const file of htmlFiles.slice(0, 3)) {
      const content = fileChanges.get(file) ?? (await getFileContent(octokit, repoOwner, repoName, file));
      if (content && !content.includes('meta name="description"')) {
        const metaDesc = await generateMetaDescription(auditResults?.url, auditResults?.seo?.details?.title);
        if (metaDesc) {
          const fixed = content.replace('</head>', `  <meta name="description" content="${metaDesc}">\n</head>`);
          fileChanges.set(file, fixed);
          fixesApplied.push({ type: 'SEO', fix: 'Added meta description', file, impact: '+8 SEO points' });
        }
      }
    }
  }

  // Fix: Missing security headers
  if (issues.some(i => /missing.*(?:security|header)/i.test(matchField(i))) || allText.includes('security header')) {
    const headersContent = `/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  X-XSS-Protection: 1; mode=block
  Strict-Transport-Security: max-age=31536000; includeSubDomains
`;
    fileChanges.set('_headers', headersContent);

    let vercelConfig: any = { headers: [] };
    try {
      const existing = await getFileContent(octokit, repoOwner, repoName, 'vercel.json');
      if (existing) vercelConfig = JSON.parse(existing);
    } catch {}

    vercelConfig.headers = [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
    fileChanges.set('vercel.json', JSON.stringify(vercelConfig, null, 2));
    fixesApplied.push({
      type: 'Security',
      fix: 'Added security headers (_headers + vercel.json)',
      files: ['_headers', 'vercel.json'],
      impact: '+15 Security points',
    });
  }

  // Fix: Missing robots.txt
  if (/robots\.txt/i.test(allText)) {
    const robotsContent = `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /.env

Sitemap: ${auditResults?.url ?? ''}/sitemap.xml
`;
    fileChanges.set('public/robots.txt', robotsContent);
    fixesApplied.push({ type: 'SEO', fix: 'Created robots.txt', file: 'public/robots.txt', impact: '+5 SEO points' });
  }

  // Fix: Missing viewport meta
  if (/viewport/i.test(allText)) {
    const htmlFiles = await findFiles(octokit, repoOwner, repoName, ['.html']);
    for (const file of htmlFiles.slice(0, 3)) {
      const content = fileChanges.get(file) ?? (await getFileContent(octokit, repoOwner, repoName, file));
      if (content && !content.includes('name="viewport"')) {
        const fixed = content.replace('<head>', '<head>\n  <meta name="viewport" content="width=device-width, initial-scale=1">');
        fileChanges.set(file, fixed);
        fixesApplied.push({ type: 'Mobile', fix: 'Added viewport meta tag', file, impact: '+10 Mobile score' });
      }
    }
  }

  // Fix: Missing Open Graph tags
  if (/open\s*graph/i.test(allText)) {
    const htmlFiles = await findFiles(octokit, repoOwner, repoName, ['.html']);
    for (const file of htmlFiles.slice(0, 1)) {
      const content = fileChanges.get(file) ?? (await getFileContent(octokit, repoOwner, repoName, file));
      if (content && !content.includes('og:title')) {
        const ogBlock = `
  <meta property="og:title" content="${auditResults?.seo?.details?.title ?? 'Website'}">
  <meta property="og:description" content="${auditResults?.seo?.details?.metaDescription ?? ''}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${auditResults?.url ?? ''}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${auditResults?.seo?.details?.title ?? 'Website'}">`;
        const fixed = content.replace('</head>', ogBlock + '\n</head>');
        fileChanges.set(file, fixed);
        fixesApplied.push({ type: 'SEO', fix: 'Added Open Graph and Twitter Card tags', file, impact: '+5 SEO points' });
      }
    }
  }

  // Fix: Render-blocking scripts
  if (/render.?blocking/i.test(allText)) {
    const htmlFiles = await findFiles(octokit, repoOwner, repoName, ['.html']);
    for (const file of htmlFiles.slice(0, 3)) {
      const content = fileChanges.get(file) ?? (await getFileContent(octokit, repoOwner, repoName, file));
      if (content) {
        const fixed = content.replace(
          /<script(?![^>]*(async|defer|type=["']module["']))[^>]*src=["'][^"']+["'][^>]*>/gi,
          (match) => {
            if (!match.includes('defer') && !match.includes('async')) {
              return match.replace('<script', '<script defer');
            }
            return match;
          }
        );
        if (fixed !== content) {
          fileChanges.set(file, fixed);
          fixesApplied.push({ type: 'Performance', fix: 'Added defer to render-blocking scripts', file, impact: '+8 Performance points' });
        }
      }
    }
  }

  // ─── Nothing fixable ───
  if (fixesApplied.length === 0) {
    return {
      success: false,
      reason: 'No automatically fixable issues found. The detected issues require manual code changes.',
      fixesApplied: [],
      estimatedGain: 0,
    };
  }

  // ─── Create Branch + Commit + PR ───
  const branchName = `auditiq-fixes-${Date.now()}`;

  await octokit.git.createRef({
    owner: repoOwner,
    repo: repoName,
    ref: `refs/heads/${branchName}`,
    sha: baseSha,
  });

  for (const [filePath, content] of fileChanges.entries()) {
    let sha: string | undefined;
    try {
      const { data: existing } = await octokit.repos.getContent({ owner: repoOwner, repo: repoName, path: filePath, ref: branchName });
      if (!Array.isArray(existing)) sha = existing.sha;
    } catch {}

    await octokit.repos.createOrUpdateFileContents({
      owner: repoOwner,
      repo: repoName,
      path: filePath,
      message: `fix(${filePath}): AuditIQ auto-fix`,
      content: Buffer.from(content).toString('base64'),
      branch: branchName,
      ...(sha ? { sha } : {}),
    });
  }

  const estimatedGain = fixesApplied.reduce((total, fix) => {
    const match = fix.impact?.match(/\+(\d+)/);
    return total + (match ? parseInt(match[1]) : 0);
  }, 0);

  const prBody = `## AuditIQ Auto-Fix PR

This PR was automatically generated by [AuditIQ](https://auditiq.com) based on your repository audit.

### Fixes Applied (${fixesApplied.length} total)

${fixesApplied.map((fix) => `- **${fix.type}**: ${fix.fix} \u2192 \`${fix.impact}\``).join('\n')}

### Estimated Score Improvement
Current score + ~${estimatedGain} points after merge

### Files Changed
${Array.from(fileChanges.keys()).map((f) => `- \`${f}\``).join('\n')}

---
*Generated by AuditIQ \u2014 [View full audit report](https://auditiq.com)*`;

  const { data: pr } = await octokit.pulls.create({
    owner: repoOwner,
    repo: repoName,
    title: `AuditIQ: Auto-fix ${fixesApplied.length} issues (est. +${estimatedGain} score)`,
    body: prBody,
    head: branchName,
    base: defaultBranch,
  });

  return {
    success: true,
    prUrl: pr.html_url,
    prNumber: pr.number,
    fixesApplied,
    estimatedGain,
    branchName,
  };
}

// ─── Helpers ───

async function generateMetaDescription(url?: string, title?: string): Promise<string> {
  try {
    const response = await aiClient.chat.completions.create(
      {
        model: process.env.LLM_MODEL || 'nvidia/llama-3.3-nemotron-super-49b-v1',
        messages: [
          {
            role: 'user',
            content: `Generate a 150-160 char SEO meta description for this website. Return ONLY the description text, nothing else.\n\nTitle: ${title ?? 'Website'}\nURL: ${url}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 100,
      },
      { timeout: 10000 }
    );
    return (response.choices[0]?.message?.content || '').trim().slice(0, 160);
  } catch {
    return `${title ?? 'Website'} \u2014 visit us for more information.`;
  }
}

async function findFiles(octokit: Octokit, owner: string, repo: string, extensions: string[]): Promise<string[]> {
  try {
    const { data: tree } = await octokit.git.getTree({ owner, repo, tree_sha: 'HEAD', recursive: '1' });
    return tree.tree
      .filter((item) => item.type === 'blob' && extensions.some((ext) => item.path?.endsWith(ext)))
      .map((item) => item.path!)
      .filter(Boolean)
      .slice(0, 20);
  } catch {
    return [];
  }
}

async function getFileContent(octokit: Octokit, owner: string, repo: string, path: string): Promise<string | null> {
  try {
    const { data } = await octokit.repos.getContent({ owner, repo, path });
    if (!Array.isArray(data) && data.type === 'file') {
      return Buffer.from(data.content, 'base64').toString('utf-8');
    }
    return null;
  } catch {
    return null;
  }
}
