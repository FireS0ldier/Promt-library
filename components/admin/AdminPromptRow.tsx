'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { STATUS_LABELS, STATUS_COLORS, AI_MODEL_LABELS } from '@/lib/utils';
import { Shield, Check, X, ExternalLink, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

interface Props {
  prompt: any;
}

export function AdminPromptRow({ prompt }: Props) {
  const [status, setStatus] = useState(prompt.status);
  const [loading, setLoading] = useState<string | null>(null);
  const supabase = createClient();

  const updateStatus = async (newStatus: string) => {
    setLoading(newStatus);
    const { error } = await supabase
      .from('prompts')
      .update({ status: newStatus })
      .eq('id', prompt.id);

    if (error) {
      toast.error('Failed to update status');
    } else {
      setStatus(newStatus);
      toast.success(`Prompt ${newStatus}`);
    }
    setLoading(null);
  };

  return (
    <tr className="hover:bg-muted/30 transition-colors">
      <td className="px-4 py-3">
        <Link href={`/prompts/${prompt.id}`} target="_blank" className="font-medium hover:text-primary flex items-center gap-1.5 line-clamp-1 max-w-xs">
          {prompt.title}
          <ExternalLink className="w-3 h-3 shrink-0 opacity-50" />
        </Link>
      </td>
      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell text-xs">
        {prompt.author?.full_name || prompt.author?.username || 'Unknown'}
      </td>
      <td className="px-4 py-3 hidden lg:table-cell">
        <span className="px-2 py-0.5 rounded-full text-xs bg-secondary capitalize">
          {AI_MODEL_LABELS[prompt.ai_model] || prompt.ai_model}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', STATUS_COLORS[status])}>
          {STATUS_LABELS[status]}
        </span>
      </td>
      <td className="px-4 py-3 hidden md:table-cell">
        <span className={`text-xs font-medium ${
          prompt.verification_score >= 70 ? 'text-green-600' :
          prompt.verification_score >= 40 ? 'text-yellow-600' : 'text-red-600'
        }`}>
          {prompt.verification_score}%
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1.5">
          {status !== 'official' && (
            <button
              onClick={() => updateStatus('official')}
              disabled={!!loading}
              title="Mark Official"
              className="p-1.5 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-900/30 text-indigo-600 transition-colors disabled:opacity-50"
            >
              {loading === 'official' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Shield className="w-3.5 h-3.5" />}
            </button>
          )}
          {status !== 'approved' && status !== 'official' && (
            <button
              onClick={() => updateStatus('approved')}
              disabled={!!loading}
              title="Approve"
              className="p-1.5 rounded-md hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600 transition-colors disabled:opacity-50"
            >
              {loading === 'approved' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            </button>
          )}
          {status !== 'rejected' && (
            <button
              onClick={() => updateStatus('rejected')}
              disabled={!!loading}
              title="Reject"
              className="p-1.5 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 transition-colors disabled:opacity-50"
            >
              {loading === 'rejected' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
