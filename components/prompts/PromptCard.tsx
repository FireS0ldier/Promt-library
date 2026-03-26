'use client';

import Link from 'next/link';
import { Prompt } from '@/types';
import { cn, formatRelativeTime, truncate, AI_MODEL_LABELS, AI_MODEL_COLORS } from '@/lib/utils';
import { Heart, Eye, Shield, Check, Copy, Star, Cpu, BookOpen } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

interface PromptCardProps {
  prompt: Prompt;
  className?: string;
}

export function PromptCard({ prompt, className }: PromptCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await navigator.clipboard.writeText(prompt.content);
    setCopied(true);
    toast.success('Copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const isSkill = prompt.type === 'skill';

  return (
    <Link href={`/prompts/${prompt.id}`}>
      <div className={cn(
        'group relative rounded-xl border bg-card transition-all duration-200 p-5 flex flex-col gap-3 cursor-pointer',
        isSkill
          ? 'hover:border-orange-300 dark:hover:border-orange-700 hover:shadow-lg hover:shadow-orange-100 dark:hover:shadow-orange-900/20'
          : 'hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5',
        className
      )}>
        {/* Skill accent line */}
        {isSkill && (
          <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl bg-gradient-to-r from-orange-400 to-red-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        )}

        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {/* Type + Model badges */}
            <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
              {/* Skill / Prompt type badge — most prominent */}
              {isSkill ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r from-orange-100 to-red-100 text-orange-700 dark:from-orange-900/40 dark:to-red-900/40 dark:text-orange-300 border border-orange-200 dark:border-orange-800">
                  <Cpu className="w-2.5 h-2.5" />
                  Skill
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground border">
                  <BookOpen className="w-2.5 h-2.5" />
                  Prompt
                </span>
              )}

              {/* AI model */}
              <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', AI_MODEL_COLORS[prompt.ai_model])}>
                {AI_MODEL_LABELS[prompt.ai_model]}
              </span>

              {/* Status */}
              {prompt.status === 'official' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                  <Shield className="w-2.5 h-2.5" />
                  Official
                </span>
              )}
              {prompt.status === 'approved' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
                  <Check className="w-2.5 h-2.5" />
                  Verified
                </span>
              )}
            </div>

            <h3 className={cn(
              'font-semibold text-base line-clamp-1 transition-colors',
              isSkill ? 'group-hover:text-orange-600 dark:group-hover:text-orange-400' : 'group-hover:text-primary'
            )}>
              {prompt.title}
            </h3>
          </div>

          <button
            onClick={handleCopy}
            className="shrink-0 p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-accent transition-all text-muted-foreground hover:text-foreground"
            title="Copy"
          >
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

        {/* Description */}
        {prompt.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {prompt.description}
          </p>
        )}

        {/* Prompt Preview */}
        <div className={cn(
          'rounded-lg px-3 py-2 text-xs font-mono text-muted-foreground line-clamp-3 border border-dashed',
          isSkill ? 'bg-orange-50/50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900/50' : 'bg-muted/50 border-muted-foreground/20'
        )}>
          {truncate(prompt.content, 200)}
        </div>

        {/* Tags */}
        {prompt.tags && prompt.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {prompt.tags.slice(0, 4).map(tag => (
              <span key={tag} className="px-2 py-0.5 rounded-full text-xs bg-secondary text-secondary-foreground">
                #{tag}
              </span>
            ))}
            {prompt.tags.length > 4 && (
              <span className="px-2 py-0.5 rounded-full text-xs text-muted-foreground">
                +{prompt.tags.length - 4}
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Heart className="w-3.5 h-3.5" />
              {prompt.like_count}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              {prompt.view_count}
            </span>
            {prompt.verification_score > 0 && (
              <span className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-yellow-500" />
                {prompt.verification_score}%
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {prompt.author && (
              <span>{prompt.author.username || prompt.author.full_name || 'Anon'}</span>
            )}
            <span>·</span>
            <span>{formatRelativeTime(prompt.created_at)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
