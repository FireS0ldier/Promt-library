'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Shield, Check, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  promptId: string;
  currentStatus: string;
}

const ACTIONS = [
  {
    status: 'official',
    label: 'Mark Official',
    icon: Shield,
    className: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    desc: 'Verified by admins — shown with Official badge',
  },
  {
    status: 'approved',
    label: 'Approve',
    icon: Check,
    className: 'bg-green-600 hover:bg-green-700 text-white',
    desc: 'Community verified — publicly visible',
  },
  {
    status: 'rejected',
    label: 'Reject',
    icon: X,
    className: 'bg-red-600 hover:bg-red-700 text-white',
    desc: 'Does not meet quality or safety standards',
  },
] as const;

export function ReviewPromptClient({ promptId, currentStatus }: Props) {
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const updateStatus = async (newStatus: string) => {
    setLoading(newStatus);
    const { error } = await supabase
      .from('prompts')
      .update({ status: newStatus })
      .eq('id', promptId);

    if (error) {
      toast.error('Failed to update status');
    } else {
      setStatus(newStatus);
      toast.success(`Marked as ${newStatus}`);
      router.refresh();
    }
    setLoading(null);
  };

  return (
    <div className="rounded-xl border bg-card p-5 space-y-3">
      <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Admin Actions</h3>

      {ACTIONS.filter(a => a.status !== status).map(({ status: s, label, icon: Icon, className, desc }) => (
        <button
          key={s}
          onClick={() => updateStatus(s)}
          disabled={!!loading}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-opacity disabled:opacity-50 ${className}`}
        >
          {loading === s ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> : <Icon className="w-4 h-4 shrink-0" />}
          <div className="text-left">
            <div>{label}</div>
            <div className="text-xs opacity-80 font-normal">{desc}</div>
          </div>
        </button>
      ))}

      {status !== currentStatus && (
        <p className="text-xs text-center text-muted-foreground pt-1">
          Status updated to <strong>{status}</strong>
        </p>
      )}
    </div>
  );
}
