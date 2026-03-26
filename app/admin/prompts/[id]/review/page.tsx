import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { ReviewPromptClient } from '@/components/admin/ReviewPromptClient';
import { VerificationBadge } from '@/components/prompts/VerificationBadge';
import { formatDate, AI_MODEL_LABELS, AI_MODEL_COLORS, STATUS_COLORS, STATUS_LABELS } from '@/lib/utils';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { ArrowLeft, Shield, Calendar, Eye, Heart, Star, User } from 'lucide-react';

export default async function ReviewPromptPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: prompt } = await supabase
    .from('prompts')
    .select('*, author:profiles(*), category:categories(*)')
    .eq('id', params.id)
    .single();

  if (!prompt) notFound();

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/admin/prompts"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-3 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Prompts
          </Link>
          <h1 className="text-2xl font-bold">Review {prompt.type === 'skill' ? 'Skill' : 'Prompt'}</h1>
        </div>
        {/* Current status */}
        <span className={cn('px-3 py-1.5 rounded-full text-sm font-medium', STATUS_COLORS[prompt.status])}>
          {STATUS_LABELS[prompt.status]}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main */}
        <div className="lg:col-span-2 space-y-5">
          {/* Title + meta */}
          <div className="rounded-xl border bg-card p-5">
            <div className="flex items-center gap-2 flex-wrap mb-3">
              <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', AI_MODEL_COLORS[prompt.ai_model])}>
                {AI_MODEL_LABELS[prompt.ai_model]}
              </span>
              {prompt.type === 'skill' && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                  Skill
                </span>
              )}
              {prompt.category && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                  {prompt.category.icon} {prompt.category.name}
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold mb-2">{prompt.title}</h2>
            {prompt.description && (
              <p className="text-muted-foreground text-sm">{prompt.description}</p>
            )}
          </div>

          {/* Content */}
          <div className="rounded-xl border bg-muted/30">
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Content</span>
              <span className="text-xs text-muted-foreground">{prompt.content.length} chars</span>
            </div>
            <pre className="p-5 text-sm font-mono whitespace-pre-wrap leading-relaxed overflow-x-auto max-h-[500px] overflow-y-auto">
              {prompt.content}
            </pre>
          </div>

          {/* Tags */}
          {prompt.tags && prompt.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {prompt.tags.map((tag: string) => (
                <span key={tag} className="px-2.5 py-1 rounded-full text-xs bg-secondary text-secondary-foreground">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Verification report */}
          {prompt.verification_results && Array.isArray(prompt.verification_results) ? (
            <VerificationBadge
              report={{
                overall_score:  prompt.verification_score,
                overall_status: prompt.verification_score >= 70 ? 'passed' : prompt.verification_score >= 40 ? 'warning' : 'failed',
                results:        prompt.verification_results as any,
                checked_at:     prompt.updated_at,
              }}
            />
          ) : (
            <div className="rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground text-center">
              No verification report available — score: {prompt.verification_score}%
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Admin actions */}
          <ReviewPromptClient promptId={prompt.id} currentStatus={prompt.status} />

          {/* Author */}
          {prompt.author && (
            <div className="rounded-xl border bg-card p-5">
              <h3 className="font-semibold text-sm mb-3 text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" /> Author
              </h3>
              <div className="flex items-center gap-3">
                {prompt.author.avatar_url ? (
                  <img src={prompt.author.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white text-sm font-bold">
                    {(prompt.author.full_name || 'U')[0].toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="font-medium text-sm">
                    {prompt.author.full_name || prompt.author.username || 'Anonymous'}
                  </div>
                  {prompt.author.username && (
                    <div className="text-xs text-muted-foreground">@{prompt.author.username}</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="rounded-xl border bg-card p-5">
            <h3 className="font-semibold text-sm mb-3 text-muted-foreground uppercase tracking-wide">Stats</h3>
            <div className="space-y-2 text-sm">
              {[
                { icon: Star,     label: 'Score',   value: `${prompt.verification_score}%` },
                { icon: Heart,    label: 'Likes',   value: prompt.like_count },
                { icon: Eye,      label: 'Views',   value: prompt.view_count },
                { icon: Calendar, label: 'Submitted', value: formatDate(prompt.created_at) },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Icon className="w-3.5 h-3.5" /> {label}
                  </span>
                  <span className="font-medium">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* View public page */}
          <Link
            href={`/prompts/${prompt.id}`}
            target="_blank"
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl border text-sm font-medium hover:bg-accent transition-colors"
          >
            View Public Page ↗
          </Link>
        </div>
      </div>
    </div>
  );
}
