import { GitHubFile } from '@/types';

const GITHUB_API = 'https://api.github.com';

export async function fetchGitHubRepoFiles(
  owner: string,
  repo: string,
  path: string = '',
  token?: string
): Promise<GitHubFile[]> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
  };
  if (token) {
    headers.Authorization = `token ${token}`;
  }

  const res = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/contents/${path}`, {
    headers,
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  const files: GitHubFile[] = [];

  if (Array.isArray(data)) {
    // Directory listing
    for (const item of data) {
      if (
        item.type === 'file' &&
        (item.name.endsWith('.md') ||
          item.name.endsWith('.txt') ||
          item.name.endsWith('.prompt'))
      ) {
        const content = await fetchFileContent(item.download_url, token);
        files.push({
          name: item.name,
          path: item.path,
          content,
          url: item.html_url,
        });
      }
    }
  } else if (data.type === 'file') {
    // Single file
    const content = Buffer.from(data.content, 'base64').toString('utf-8');
    files.push({
      name: data.name,
      path: data.path,
      content,
      url: data.html_url,
    });
  }

  return files;
}

async function fetchFileContent(downloadUrl: string, token?: string): Promise<string> {
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `token ${token}`;

  const res = await fetch(downloadUrl, { headers });
  if (!res.ok) throw new Error(`Failed to fetch file: ${res.status}`);
  return res.text();
}

export function parseGitHubUrl(url: string): { owner: string; repo: string; path: string } | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== 'github.com') return null;

    const parts = parsed.pathname.split('/').filter(Boolean);
    if (parts.length < 2) return null;

    const owner = parts[0];
    const repo = parts[1];
    // Handle /blob/main/path/to/file
    const pathParts = parts.slice(parts.indexOf('blob') !== -1 ? parts.indexOf('blob') + 2 : 2);
    const path = pathParts.join('/');

    return { owner, repo, path };
  } catch {
    return null;
  }
}
