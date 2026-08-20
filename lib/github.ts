import { Octokit } from '@octokit/rest';

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN || undefined,
});

export interface RepoFile {
  path: string;
  name: string;
  content: string;
  size: number;
  sha: string;
}

export interface RepoInfo {
  owner: string;
  repo: string;
  description: string;
  language: string;
  stars: number;
  forks: number;
  defaultBranch: string;
  totalFiles: number;
}

// Parse GitHub URL → owner/repo
export function parseGitHubUrl(url: string): { owner: string; repo: string } {
  const cleaned = url.replace(/\.git$/, '').replace(/\/+$/, '');
  const match = cleaned.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) throw new Error('Invalid GitHub URL format. Expected: https://github.com/owner/repo');
  return { owner: match[1], repo: match[2] };
}

// Get repo metadata
export async function getRepoInfo(owner: string, repo: string): Promise<RepoInfo> {
  const { data } = await octokit.repos.get({ owner, repo });
  return {
    owner,
    repo,
    description: data.description || '',
    language: data.language || 'Unknown',
    stars: data.stargazers_count,
    forks: data.forks_count,
    defaultBranch: data.default_branch,
    totalFiles: 0,
  };
}

// Extensions to scan
const SCAN_EXTENSIONS = new Set([
  '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs',
  '.py', '.rb', '.java', '.go', '.rs', '.php',
  '.html', '.css', '.scss', '.less',
  '.json', '.yaml', '.yml', '.toml',
  '.env', '.config', '.sh', '.bash',
]);

// Directories to skip
const SKIP_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', '.next',
  'coverage', '.cache', '__pycache__', 'vendor',
  '.idea', '.vscode', 'target', 'bin', 'obj',
]);

// Max file size to fetch (50KB)
const MAX_FILE_SIZE = 50000;

// Max total files to analyze
const MAX_FILES = 100;

export async function fetchRepoFiles(
  owner: string,
  repo: string,
  branch: string = 'main'
): Promise<{ files: RepoFile[]; totalInRepo: number }> {
  // Get full tree
  let tree: any[];
  try {
    const { data } = await octokit.git.getTree({
      owner,
      repo,
      tree_sha: branch,
      recursive: 'true',
    });
    tree = data.tree;
  } catch {
    // Try 'master' if 'main' fails
    const { data } = await octokit.git.getTree({
      owner,
      repo,
      tree_sha: 'master',
      recursive: 'true',
    });
    tree = data.tree;
  }

  // Filter to source files
  const sourceFiles = tree.filter((item: any) => {
    if (item.type !== 'blob') return false;
    const path = item.path as string;
    const parts = path.split('/');
    // Skip directories
    if (parts.some(p => SKIP_DIRS.has(p))) return false;
    // Check extension
    const ext = '.' + path.split('.').pop()?.toLowerCase();
    if (!SCAN_EXTENSIONS.has(ext)) return false;
    // Check size
    if (item.size && item.size > MAX_FILE_SIZE) return false;
    return true;
  });

  const totalInRepo = sourceFiles.length;
  const filesToFetch = sourceFiles.slice(0, MAX_FILES);

  // Fetch contents in parallel batches
  const files: RepoFile[] = [];
  const batchSize = 10;

  for (let i = 0; i < filesToFetch.length; i += batchSize) {
    const batch = filesToFetch.slice(i, i + batchSize);
    const results = await Promise.allSettled(
      batch.map(async (item: any) => {
        try {
          const { data } = await octokit.repos.getContent({
            owner,
            repo,
            path: item.path,
            ref: branch,
          });

          if ('content' in data && data.encoding === 'base64') {
            const content = Buffer.from(data.content, 'base64').toString('utf-8');
            return {
              path: item.path,
              name: item.path.split('/').pop() || '',
              content,
              size: content.length,
              sha: item.sha,
            };
          }
          return null;
        } catch {
          return null;
        }
      })
    );

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        files.push(result.value);
      }
    }
  }

  return { files, totalInRepo };
}
