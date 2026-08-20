import { parseGitHubUrl, getRepoInfo, fetchRepoFiles, RepoInfo, RepoFile } from '../lib/github';
import { analyzeCodebase, CodeIssue } from '../lib/code-analyzer';

export interface GitHubAuditResult {
  repo: RepoInfo;
  filesScanned: number;
  totalFilesInRepo: number;
  issues: CodeIssue[];
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
  fileStats: Array<{
    path: string;
    lines: number;
    functions: number;
    complexity: number;
    issueCount: number;
  }>;
  timestamp: string;
}

export async function runGitHubAudit(repoUrl: string): Promise<GitHubAuditResult> {
  // Parse URL
  const { owner, repo } = parseGitHubUrl(repoUrl);
  console.log(`📦 Scanning ${owner}/${repo}...`);

  // Get repo info
  const repoInfo = await getRepoInfo(owner, repo);
  console.log(`  📋 Repo: ${repoInfo.description || 'No description'} (${repoInfo.language})`);

  // Fetch source files
  console.log(`  📂 Fetching source files...`);
  const { files, totalInRepo } = await fetchRepoFiles(owner, repo, repoInfo.defaultBranch);
  console.log(`  📄 Fetched ${files.length} files (total source files: ${totalInRepo})`);

  if (files.length === 0) {
    return {
      repo: { ...repoInfo, totalFiles: totalInRepo },
      filesScanned: 0,
      totalFilesInRepo: totalInRepo,
      issues: [],
      summary: {
        totalIssues: 0,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        info: 0,
        filesScanned: 0,
        totalLines: 0,
        securityScore: 100,
      },
      fileStats: [],
      timestamp: new Date().toISOString(),
    };
  }

  // Analyze codebase
  console.log(`  🔍 Analyzing code...`);
  const analysisResults = analyzeCodebase(files.map(f => ({ path: f.path, content: f.content })));

  console.log(`  🐛 Found ${analysisResults.summary.totalIssues} issues`);
  console.log(`     Critical: ${analysisResults.summary.critical}, High: ${analysisResults.summary.high}, Medium: ${analysisResults.summary.medium}`);

  // Build file stats
  const fileStats = analysisResults.fileAnalyses.map(fa => ({
    path: fa.path,
    lines: fa.stats.lines,
    functions: fa.stats.functions,
    complexity: fa.stats.complexity,
    issueCount: fa.issues.length,
  }));

  return {
    repo: { ...repoInfo, totalFiles: totalInRepo },
    filesScanned: files.length,
    totalFilesInRepo: totalInRepo,
    issues: analysisResults.issues,
    summary: analysisResults.summary,
    fileStats,
    timestamp: new Date().toISOString(),
  };
}
