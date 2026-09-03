'use client';

import { useState, useEffect, useRef } from 'react';
import { signIn } from 'next-auth/react';

interface GitHubRepo {
  id: number;
  name: string;
  fullName: string;
  description: string;
  language: string;
  stars: number;
  forks: number;
  updatedAt: string;
  url: string;
  isPrivate: boolean;
}

interface GitHubRepoPickerProps {
  onSelect: (repoUrl: string) => void;
  onManualUrl: () => void;
  isGithubConnected: boolean;
  loading: boolean;
}

export default function GitHubRepoPicker({
  onSelect,
  onManualUrl,
  isGithubConnected,
  loading,
}: GitHubRepoPickerProps) {
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [search, setSearch] = useState('');
  const [fetching, setFetching] = useState(false);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch repos when connected
  useEffect(() => {
    if (!isGithubConnected) return;
    setFetching(true);
    fetch('/api/github/repos')
      .then((r) => r.json())
      .then((d) => setRepos(d.repos || []))
      .catch(() => setRepos([]))
      .finally(() => setFetching(false));
  }, [isGithubConnected]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = repos.filter(
    (r) =>
      r.fullName.toLowerCase().includes(search.toLowerCase()) ||
      r.description.toLowerCase().includes(search.toLowerCase()) ||
      r.language.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (repo: GitHubRepo) => {
    setSearch('');
    setOpen(false);
    onSelect(repo.url);
  };

  // ── Not connected state ──
  if (!isGithubConnected) {
    return (
      <div className="space-y-3">
        <div className="relative">
          <input
            type="text"
            placeholder="Enter GitHub repo URL (e.g., github.com/user/repo)"
            className="input text-base w-full"
            disabled={loading}
          />
        </div>
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary whitespace-nowrap disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Scanning...
              </span>
            ) : (
              'Scan Repository'
            )}
          </button>
          <span className="text-text-muted text-xs">or</span>
          <button
            type="button"
            onClick={() => signIn('github', { callbackUrl: '/' })}
            className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 border border-white/20 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            Connect GitHub to pick repos
          </button>
        </div>
      </div>
    );
  }

  // ── Connected state — repo picker ──
  return (
    <div className="space-y-3">
      <div className="relative" ref={dropdownRef}>
        {/* Search Input */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            placeholder={fetching ? 'Loading your repos...' : 'Search your repositories...'}
            className="input text-base w-full pl-10"
            disabled={loading || fetching}
          />
          {fetching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Dropdown */}
        {open && !fetching && (
          <div className="absolute z-50 w-full mt-1 bg-bg-surface border border-border-subtle rounded-xl shadow-2xl max-h-80 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="p-4 text-center text-text-muted text-sm">
                {search ? 'No repos match your search' : 'No repos found'}
              </div>
            ) : (
              <>
                <div className="px-3 py-2 text-xs text-text-muted border-b border-border-subtle">
                  {filtered.length} repo{filtered.length !== 1 ? 's' : ''} found
                </div>
                {filtered.map((repo) => (
                  <button
                    key={repo.id}
                    onClick={() => handleSelect(repo)}
                    className="w-full text-left px-4 py-3 hover:bg-primary/5 transition-colors border-b border-border-subtle/50 last:border-0"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm truncate">{repo.name}</span>
                          {repo.isPrivate && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent-amber/10 text-accent-amber">Private</span>
                          )}
                        </div>
                        {repo.description && (
                          <p className="text-xs text-text-muted mt-0.5 truncate">{repo.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-1 text-xs text-text-muted">
                          {repo.language && repo.language !== 'Unknown' && (
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-accent-blue" />
                              {repo.language}
                            </span>
                          )}
                          {repo.stars > 0 && <span>⭐ {repo.stars}</span>}
                          {repo.forks > 0 && <span>🍴 {repo.forks}</span>}
                        </div>
                      </div>
                      <span className="text-xs text-text-muted whitespace-nowrap">
                        {new Date(repo.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </button>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* Manual URL option */}
      <div className="flex items-center gap-2">
        <span className="text-text-muted text-xs">or paste a URL manually</span>
        <button
          type="button"
          onClick={onManualUrl}
          className="text-xs text-primary hover:underline"
        >
          Switch to URL input
        </button>
      </div>
    </div>
  );
}
