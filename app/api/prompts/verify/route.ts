import { NextRequest, NextResponse } from 'next/server';
import { verifyPrompt } from '@/lib/verification';

export async function POST(request: NextRequest) {
  try {
    const { content, title } = await request.json();

    if (!content || !title) {
      return NextResponse.json({ error: 'Content and title are required' }, { status: 400 });
    }

    const report = verifyPrompt(content, title);
    return NextResponse.json({ report });
  } catch (error) {
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
