import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { VerificationBadge } from '@/components/prompts/VerificationBadge';
import { PromptDetailClient } from '@/components/prompts/PromptDetailClient';
import { Prompt, PromptVersion, Comment, Suggestion } from '@/types';
import { formatDate, AI_MODEL_LABELS, AI_MODEL_COLORS } from '@/lib/utils';
import { Shield, GitBranch, Calendar, Eye, Heart, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Metadata } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://promptvault.com';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const supabase = createClient();
  const { data: prompt } = await supabase
    .from('prompts')
    .select('title, description, ai_model, category:categories(name)')
    .eq('id', params.id)
    .single();

  if (!prompt) {
    return { title: 'Prompt Not Found — PromptVault' };
  }

  const title = `${prompt.title} — PromptVault`;
  const description = prompt.description
    || `AI prompt for ${AI_MODEL_LABELS[prompt.ai_model] || prompt.ai_model}. Browse and use this prompt on PromptVault.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      url: `${baseUrl}/prompts/${params.id}`,
    },
  };
}

export default async function PromptDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const [
    { data: prompt },
    { data: { user } },
  ] = await Promise.all([
    supabase
      .from('prompts')
      .select('*, author:profiles(*), category:categories(*)')
      .eq('id', params.id)
      .single(),
    supabase.auth.getUser(),
  ]);

  if (!prompt) notFound();

  // Increment view count (fire and forget)
  supabase
    .from('prompts')
    .update({ view_count: (prompt.view_count || 0) + 1 })
    .eq('id', params.id)
    .then(() => {});

  const [
    { data: versions },
    { data: comments },
    { data: suggestions },
    { data: likeData },
  ] = await Promise.all([
    supabase
      .from('prompt_versions')
      .select('*, author:profiles(*)')
      .eq('prompt_id', params.id)
      .order('version_number', { ascending: false }),
    supabase
      .from('comments')
      .select('*, author:profiles(*)')
      .eq('prompt_id', params.id)
      .is('parent_id', null)
      .order('created_at', { ascending: true }),
    user
      ? supabase
          .from('suggestions')
          .select('*, author:profiles(*)')
          .eq('prompt_id', params.id)
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: null }),
    user
      ? supabase
          .from('likes')
          .select('*')
          .eq('prompt_id', params.id)
          .eq('user_id', user.id)
          .single()
      : Promise.resolve({ data: null }),
  ]);

  const isLiked = !!likeData;
  const isAuthor = user?.id === prompt.author_id;
  const isAdmin = false; // Check profile.is_admin

  const promptWithLike = { ...prompt, is_liked: isLiked };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-3">
              <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium', AI_MODEL_COLORS[prompt.ai_model])}>
                {AI_MODEL_LABELS[prompt.ai_model]}
              </span>
              {prompt.status === 'official' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                  <Shield className="w-3 h-3" />
                  Official
                </span>
              )}
              {prompt.category && (
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                  {prompt.category.icon} {prompt.category.name}
                </span>
              )}
              <span className="text-xs text-muted-foreground">v{prompt.version || 1}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">{prompt.title}</h1>
            {prompt.description && (
              <p className="text-muted-foreground">{prompt.description}</p>
            )}
          </div>

          {/* Prompt Content */}
          <PromptDetailClient
            prompt={promptWithLike}
            user={user}
            isAuthor={isAuthor}
            versions={versions || []}
            comments={comments || []}
            suggestions={suggestions || []}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Stats */}
          <div className="rounded-xl border bg-card p-5">
            <h3 className="font-semibold text-sm mb-4 text-muted-foreground uppercase tracking-wide">Stats</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground"><Heart className="w-4 h-4" /> Likes</span>
                <span className="font-medium">{prompt.like_count}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground"><Eye className="w-4 h-4" /> Views</span>
                <span className="font-medium">{prompt.view_count}</span>
              </div>
              {prompt.verification_score > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground"><Star className="w-4 h-4" /> Quality Score</span>
                  <span className="font-medium">{prompt.verification_score}%</span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground"><Calendar className="w-4 h-4" /> Created</span>
                <span className="font-medium">{formatDate(prompt.created_at)}</span>
              </div>
            </div>
          </div>

          {/* Author */}
          {prompt.author && (
            <div className="rounded-xl border bg-card p-5">
              <h3 className="font-semibold text-sm mb-4 text-muted-foreground uppercase tracking-wide">Author</h3>
              <div className="flex items-center gap-3">
                {prompt.author.avatar_url ? (
                  <img src={prompt.author.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white font-bold">
                    {(prompt.author.full_name || prompt.author.username || 'U')[0].toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="font-medium text-sm">{prompt.author.full_name || prompt.author.username || 'Anonymous'}</div>
                  {prompt.author.username && (
                    <div className="text-xs text-muted-foreground">@{prompt.author.username}</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tags */}
          {prompt.tags && prompt.tags.length > 0 && (
            <div className="rounded-xl border bg-card p-5">
              <h3 className="font-semibold text-sm mb-3 text-muted-foreground uppercase tracking-wide">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {prompt.tags.map((tag: string) => (
                  <span key={tag} className="px-2.5 py-1 rounded-full text-xs bg-secondary text-secondary-foreground">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* GitHub Source */}
          {prompt.github_url && (
            <div className="rounded-xl border bg-card p-5">
              <h3 className="font-semibold text-sm mb-3 text-muted-foreground uppercase tracking-wide">Source</h3>
              <a
                href={prompt.github_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <GitBranch className="w-4 h-4" />
                View on GitHub
              </a>
            </div>
          )}

          {/* Verification Report */}
          {prompt.verification_results && Array.isArray(prompt.verification_results) && (
            <div>
              <h3 className="font-semibold text-sm mb-3 text-muted-foreground uppercase tracking-wide">Verification</h3>
              <VerificationBadge
                report={{
                  overall_score: prompt.verification_score,
                  overall_status: prompt.verification_score >= 70 ? 'passed' : prompt.verification_score >= 40 ? 'warning' : 'failed',
                  results: prompt.verification_results as any,
                  checked_at: prompt.updated_at,
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
