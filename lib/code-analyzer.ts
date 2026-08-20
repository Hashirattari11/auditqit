// Pattern-based code analysis for security, bugs, and quality issues

export interface CodeIssue {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  category: 'security' | 'bug' | 'quality' | 'performance' | 'best-practice';
  title: string;
  description: string;
  file: string;
  line: number | null;
  codeSnippet: string;
  fixSuggestion: string;
  fixedCode: string | null;
}

// Security patterns
const SECURITY_PATTERNS: Array<{
  pattern: RegExp;
  title: string;
  description: string;
  severity: CodeIssue['severity'];
  fix: string;
  fixedCode: string;
}> = [
  {
    pattern: /eval\s*\(/gi,
    title: 'Use of eval()',
    description: 'eval() executes arbitrary code and is a major security risk. It can lead to code injection attacks.',
    severity: 'critical',
    fix: 'Replace eval() with JSON.parse() for data, or use Function constructor with proper validation.',
    fixedCode: '// Before: eval(data)\n// After: JSON.parse(data)',
  },
  {
    pattern: /innerHTML\s*=/gi,
    title: 'Direct innerHTML assignment',
    description: 'Setting innerHTML directly can lead to XSS (Cross-Site Scripting) attacks.',
    severity: 'high',
    fix: 'Use textContent for plain text, or sanitize HTML with DOMPurify before setting innerHTML.',
    fixedCode: '// Before: element.innerHTML = userContent\n// After: element.textContent = userContent\n// Or: element.innerHTML = DOMPurify.sanitize(userContent)',
  },
  {
    pattern: /document\.write\s*\(/gi,
    title: 'Use of document.write()',
    description: 'document.write() is deprecated and can be exploited for XSS attacks.',
    severity: 'high',
    fix: 'Use DOM manipulation methods like appendChild(), insertAdjacentHTML(), or template literals with textContent.',
    fixedCode: '// Before: document.write(content)\n// After: document.body.insertAdjacentHTML("beforeend", content)',
  },
  {
    pattern: /new\s+Function\s*\(/gi,
    title: 'Dynamic Function constructor',
    description: 'Using Function() constructor is similar to eval() and can execute arbitrary code.',
    severity: 'high',
    fix: 'Avoid dynamic code execution. Use object lookup patterns or proper module imports instead.',
    fixedCode: '// Before: new Function("return " + data)()\n// After: Use a lookup object or import the module directly',
  },
  {
    pattern: /\$\{.*\}.*(?:query|execute|sql)/gi,
    title: 'Potential SQL Injection',
    description: 'String interpolation in SQL queries can lead to SQL injection attacks.',
    severity: 'critical',
    fix: 'Use parameterized queries or prepared statements instead of string interpolation.',
    fixedCode: '// Before: db.query(`SELECT * FROM users WHERE id = ${userId}`)\n// After: db.query("SELECT * FROM users WHERE id = ?", [userId])',
  },
  {
    pattern: /(?:password|secret|api.?key|token)\s*[:=]\s*["'][^"']+["']/gi,
    title: 'Hardcoded Secret',
    description: 'Hardcoded secrets in source code can be exposed in version control.',
    severity: 'critical',
    fix: 'Move secrets to environment variables and never commit them to version control.',
    fixedCode: '// Before: const API_KEY = "sk-1234567890"\n// After: const API_KEY = process.env.API_KEY',
  },
  {
    pattern: /(?:http:)[^"'\s]*/gi,
    title: 'Insecure HTTP URL',
    description: 'Using HTTP instead of HTTPS exposes data to man-in-the-middle attacks.',
    severity: 'medium',
    fix: 'Always use HTTPS for external URLs to ensure encrypted communication.',
    fixedCode: '// Before: fetch("http://api.example.com/data")\n// After: fetch("https://api.example.com/data")',
  },
  {
    pattern: /console\.(?:log|debug|info)\s*\(/gi,
    title: 'Console logging in production',
    description: 'Console logs can leak sensitive information in production environments.',
    severity: 'low',
    fix: 'Remove console logs or use a proper logging library with log levels.',
    fixedCode: '// Remove or use a logger:\n// logger.info("message") instead of console.log("message")',
  },
];

// Bug patterns
const BUG_PATTERNS: Array<{
  pattern: RegExp;
  title: string;
  description: string;
  severity: CodeIssue['severity'];
  fix: string;
  fixedCode: string;
}> = [
  {
    pattern: /==(?!=)/g,
    title: 'Loose equality comparison',
    description: 'Using == instead of === can cause unexpected type coercion bugs.',
    severity: 'medium',
    fix: 'Always use strict equality (===) to avoid type coercion issues.',
    fixedCode: '// Before: if (value == null)\n// After: if (value === null || value === undefined)',
  },
  {
    pattern: /catch\s*\(\s*\w*\s*\)\s*\{\s*\}/g,
    title: 'Empty catch block',
    description: 'Empty catch blocks silently swallow errors, making debugging difficult.',
    severity: 'medium',
    fix: 'Always handle errors properly - at minimum log them for debugging.',
    fixedCode: '// Before: catch (e) { }\n// After: catch (e) { console.error("Error:", e); }',
  },
  {
    pattern: /var\s+/g,
    title: 'Use of var keyword',
    description: 'var has function scope instead of block scope, leading to unexpected hoisting behavior.',
    severity: 'medium',
    fix: 'Use const for constants and let for variables that need reassignment.',
    fixedCode: '// Before: var x = 10\n// After: const x = 10 (or let x = 10 if reassigned)',
  },
  {
    pattern: /setTimeout\s*\(\s*["'][^"']+["']/g,
    title: 'String argument in setTimeout',
    description: 'Passing a string to setTimeout is equivalent to eval() and is a security risk.',
    severity: 'high',
    fix: 'Pass a function reference instead of a string to setTimeout.',
    fixedCode: '// Before: setTimeout("doSomething()", 1000)\n// After: setTimeout(() => doSomething(), 1000)',
  },
  {
    pattern: /(?:===|!==)\s*(?:undefined|null)\b/g,
    title: 'Redundant null/undefined check',
    description: 'Comparing with === undefined or === null can be simplified.',
    severity: 'low',
    fix: 'Use == null to check for both null and undefined, or use optional chaining.',
    fixedCode: '// Before: x === undefined || x === null\n// After: x == null or x?.property',
  },
];

// Quality patterns
const QUALITY_PATTERNS: Array<{
  pattern: RegExp;
  title: string;
  description: string;
  severity: CodeIssue['severity'];
  fix: string;
  fixedCode: string;
}> = [
  {
    pattern: /(?:function\s+\w+|[=>])\s*{[^}]{500,}}/g,
    title: 'Very long function',
    description: 'Functions longer than 50 lines are hard to test, maintain, and understand.',
    severity: 'medium',
    fix: 'Break long functions into smaller, focused functions that do one thing well.',
    fixedCode: '// Split into smaller functions:\n// function validateInput(data) { ... }\n// function processData(data) { ... }\n// function saveResult(result) { ... }',
  },
  {
    pattern: /(?:TODO|FIXME|HACK|XXX|BUG)\s*[:\(]/gi,
    title: 'Unresolved TODO/FIXME',
    description: 'Unresolved TODO or FIXME comments indicate incomplete or problematic code.',
    severity: 'info',
    fix: 'Address the TODO/FIXME or create a ticket to track it.',
    fixedCode: '// Resolve the issue or create a tracking ticket',
  },
  {
    pattern: /(?:any)\b/g,
    title: 'TypeScript any type',
    description: 'Using "any" type defeats the purpose of TypeScript\'s type safety.',
    severity: 'low',
    fix: 'Define proper types or use "unknown" if the type is truly dynamic.',
    fixedCode: '// Before: function process(data: any)\n// After: function process(data: UserData) or function process(data: unknown)',
  },
];

interface FileAnalysis {
  path: string;
  issues: CodeIssue[];
  stats: {
    lines: number;
    functions: number;
    complexity: number;
  };
}

// Analyze a single file
export function analyzeFile(filePath: string, content: string): FileAnalysis {
  const issues: CodeIssue[] = [];
  const lines = content.split('\n');
  const lineCount = lines.length;

  // Count functions (rough estimate)
  const functionMatches = content.match(/(?:function\s+\w+|(?:const|let|var)\s+\w+\s*=\s*(?:async\s*)?\(?:[^)]*\)\s*=>|(?:async\s+)?(?:function\s*)?\()/g);
  const functionCount = functionMatches ? functionMatches.length : 0;

  // Rough complexity estimate
  const complexityKeywords = content.match(/(?:if|else|for|while|switch|case|catch|&&|\|\||\?)/g);
  const complexity = complexityKeywords ? complexityKeywords.length + 1 : 1;

  // Check all patterns
  const allPatterns = [
    ...SECURITY_PATTERNS.map(p => ({ ...p, category: 'security' as const })),
    ...BUG_PATTERNS.map(p => ({ ...p, category: 'bug' as const })),
    ...QUALITY_PATTERNS.map(p => ({ ...p, category: 'quality' as const })),
  ];

  for (const { pattern, title, description, severity, fix, fixedCode, category } of allPatterns) {
    // Reset regex lastIndex
    pattern.lastIndex = 0;

    let match;
    while ((match = pattern.exec(content)) !== null) {
      // Find the line number
      const beforeMatch = content.substring(0, match.index);
      const lineNumber = beforeMatch.split('\n').length;
      const line = lines[lineNumber - 1] || '';

      // Get code snippet (current line + context)
      const startLine = Math.max(0, lineNumber - 2);
      const endLine = Math.min(lines.length, lineNumber + 1);
      const codeSnippet = lines.slice(startLine, endLine).join('\n');

      issues.push({
        id: `${category}-${title.toLowerCase().replace(/\s+/g, '-')}-${lineNumber}`,
        severity,
        category,
        title,
        description,
        file: filePath,
        line: lineNumber,
        codeSnippet,
        fixSuggestion: fix,
        fixedCode,
      });
    }
  }

  return {
    path: filePath,
    issues,
    stats: {
      lines: lineCount,
      functions: functionCount,
      complexity,
    },
  };
}

// Analyze all files and generate summary
export function analyzeCodebase(files: Array<{ path: string; content: string }>): {
  issues: CodeIssue[];
  fileAnalyses: FileAnalysis[];
  summary: {
    totalIssues: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
    filesScanned: number;
    totalLines: number;
    securityScore: number;
  };
} {
  const fileAnalyses = files.map(f => analyzeFile(f.path, f.content));
  const allIssues = fileAnalyses.flatMap(fa => fa.issues);

  // Deduplicate issues by title + file + line
  const seen = new Set<string>();
  const uniqueIssues = allIssues.filter(issue => {
    const key = `${issue.title}-${issue.file}-${issue.line}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Sort by severity
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
  uniqueIssues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  const summary = {
    totalIssues: uniqueIssues.length,
    critical: uniqueIssues.filter(i => i.severity === 'critical').length,
    high: uniqueIssues.filter(i => i.severity === 'high').length,
    medium: uniqueIssues.filter(i => i.severity === 'medium').length,
    low: uniqueIssues.filter(i => i.severity === 'low').length,
    info: uniqueIssues.filter(i => i.severity === 'info').length,
    filesScanned: files.length,
    totalLines: fileAnalyses.reduce((sum, fa) => sum + fa.stats.lines, 0),
    securityScore: Math.max(0, 100 - (
      uniqueIssues.filter(i => i.severity === 'critical').length * 20 +
      uniqueIssues.filter(i => i.severity === 'high').length * 10 +
      uniqueIssues.filter(i => i.severity === 'medium').length * 3 +
      uniqueIssues.filter(i => i.severity === 'low').length * 1
    )),
  };

  return {
    issues: uniqueIssues,
    fileAnalyses,
    summary,
  };
}
