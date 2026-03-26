import { NextRequest, NextResponse } from 'next/server';
import { fetchGitHubRepoFiles, parseGitHubUrl } from '@/lib/github';

export async function POST(request: NextRequest) {
  try {
    const { url, token } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'GitHub URL is required' }, { status: 400 });
    }

    const parsed = parseGitHubUrl(url);
    if (!parsed) {
      return NextResponse.json({ error: 'Invalid GitHub URL' }, { status: 400 });
    }

    const files = await fetchGitHubRepoFiles(parsed.owner, parsed.repo, parsed.path, token);

    if (files.length === 0) {
      return NextResponse.json(
        { error: 'No .md, .txt, or .prompt files found at that URL' },
        { status: 404 }
      );
    }

    return NextResponse.json({ files });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to import from GitHub' },
      { status: 500 }
    );
  }
}
