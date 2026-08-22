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

  // ─── FIX 1: Missing meta description ───
  const metaIssue = issues.find(
    (i) => i.issue?.includes('meta description') || i.type?.includes('meta description')
  );
  if (metaIssue) {
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

  // ─── FIX 2: Missing security headers ───
  const securityIssues = issues.filter(
    (i) => i.issue?.includes('Missing') && (i.category === 'Security' || i.type?.includes('Security'))
  );
  if (securityIssues.length > 0) {
    // Create _headers file (Netlify/Vercel)
    const headersContent = `/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  X-XSS-Protection: 1; mode=block
  Strict-Transport-Security: max-age=31536000; includeSubDomains
`;
    fileChanges.set('_headers', headersContent);

    // Create/update vercel.json
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
      fix: `Added ${securityIssues.length} missing security headers`,
      files: ['_headers', 'vercel.json'],
      impact: '+15 Security points',
    });
  }

  // ─── FIX 3: Missing robots.txt ───
  const robotsIssue = issues.find((i) => i.issue?.includes('robots.txt'));
  if (robotsIssue) {
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

  // ─── FIX 4: Missing viewport meta ───
  const viewportIssue = issues.find((i) => i.type?.includes('viewport') || i.issue?.includes('viewport'));
  if (viewportIssue) {
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

  // ─── FIX 5: Missing Open Graph tags ───
  const ogIssue = issues.find((i) => i.issue?.includes('Open Graph'));
  if (ogIssue) {
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

  // ─── FIX 6: Render-blocking scripts ───
  const renderBlockingIssue = issues.find((i) => i.type?.includes('render-blocking') || i.issue?.includes('render-blocking'));
  if (renderBlockingIssue) {
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

  if (fixesApplied.length === 0) {
    return { success: false, reason: 'No automatically fixable issues found in repo files', fixesApplied: [], estimatedGain: 0 };
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

  const prBody = `## 🤖 AuditIQ Auto-Fix PR

This PR was automatically generated by [AuditIQ](https://auditiq.com) based on your site audit.

### ✅ Fixes Applied (${fixesApplied.length} total)

${fixesApplied.map((fix) => `- **${fix.type}**: ${fix.fix} → \`${fix.impact}\``).join('\n')}

### 📊 Estimated Score Improvement
Current score + ~${estimatedGain} points after merge

### 🔍 Files Changed
${Array.from(fileChanges.keys()).map((f) => `- \`${f}\``).join('\n')}

---
*Generated by AuditIQ — [View full audit report](https://auditiq.com)*`;

  const { data: pr } = await octokit.pulls.create({
    owner: repoOwner,
    repo: repoName,
    title: `🤖 AuditIQ: Auto-fix ${fixesApplied.length} issues (est. +${estimatedGain} score)`,
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
    return `${title ?? 'Website'} — visit us for more information.`;
  }
}

async function findFiles(octokit: Octokit, owner: string, repo: string, extensions: string[]): Promise<string[]> {
  try {
    const { data: tree } = await octokit.git.getTree({ owner, repo, tree_sha: 'HEAD', recursive: '1' });
    return tree.tree
      .filter((item) => item.type === 'blob' && extensions.some((ext) => item.path?.endsWith(ext)))
      .map((item) => item.path!)
      .filter(Boolean)
      .slice(0, 10);
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
