'use client';

import Link from 'next/link';
import { Prompt } from '@/types';
import { cn, formatRelativeTime, truncate, AI_MODEL_LABELS, AI_MODEL_COLORS, STATUS_LABELS, STATUS_COLORS } from '@/lib/utils';
import { Heart, Eye, MessageSquare, Shield, Star, Copy, Check } from 'lucide-react';
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
    toast.success('Prompt copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Link href={`/prompts/${prompt.id}`}>
      <div className={cn(
        'group relative rounded-xl border bg-card hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200 p-5 flex flex-col gap-3 cursor-pointer',
        className
      )}>
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', AI_MODEL_COLORS[prompt.ai_model])}>
                {AI_MODEL_LABELS[prompt.ai_model]}
              </span>
              {prompt.status === 'official' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                  <Shield className="w-3 h-3" />
                  Official
                </span>
              )}
              {prompt.status === 'approved' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
                  <Check className="w-3 h-3" />
                  Verified
                </span>
              )}
            </div>
            <h3 className="font-semibold text-base line-clamp-1 group-hover:text-primary transition-colors">
              {prompt.title}
            </h3>
          </div>

          <button
            onClick={handleCopy}
            className="shrink-0 p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-accent transition-all text-muted-foreground hover:text-foreground"
            title="Copy prompt"
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
        <div className="rounded-lg bg-muted/50 px-3 py-2 text-xs font-mono text-muted-foreground line-clamp-3 border border-dashed border-muted-foreground/20">
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
                +{prompt.tags.length - 4} more
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
          <div className="flex items-center gap-2">
            {prompt.author && (
              <span className="text-xs">
                by {prompt.author.username || prompt.author.full_name || 'Anonymous'}
              </span>
            )}
            <span>·</span>
            <span>{formatRelativeTime(prompt.created_at)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
