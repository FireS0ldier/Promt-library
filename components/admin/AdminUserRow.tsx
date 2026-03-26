'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatDate } from '@/lib/utils';
import { Shield, ShieldOff, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  user: any;
}

export function AdminUserRow({ user }: Props) {
  const [isAdmin, setIsAdmin] = useState(user.is_admin);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const toggleAdmin = async () => {
    setLoading(true);
    const { error } = await supabase
      .from('profiles')
      .update({ is_admin: !isAdmin })
      .eq('id', user.id);

    if (error) {
      toast.error('Failed to update user');
    } else {
      setIsAdmin(!isAdmin);
      toast.success(`User ${!isAdmin ? 'promoted to admin' : 'demoted from admin'}`);
    }
    setLoading(false);
  };

  return (
    <tr className="hover:bg-muted/30 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          {user.avatar_url ? (
            <img src={user.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
              {(user.full_name || 'U')[0].toUpperCase()}
            </div>
          )}
          <span className="font-medium">{user.full_name || 'No Name'}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
        {user.username ? `@${user.username}` : '—'}
      </td>
      <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell text-xs">
        {formatDate(user.created_at)}
      </td>
      <td className="px-4 py-3">
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
          isAdmin
            ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300'
            : 'bg-secondary text-secondary-foreground'
        }`}>
          {isAdmin ? 'Admin' : 'User'}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex justify-end">
          <button
            onClick={toggleAdmin}
            disabled={loading}
            title={isAdmin ? 'Remove admin' : 'Make admin'}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors disabled:opacity-50 ${
              isAdmin
                ? 'hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600'
                : 'hover:bg-violet-100 dark:hover:bg-violet-900/30 text-violet-600'
            }`}
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> :
              isAdmin ? <ShieldOff className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />
            }
            {isAdmin ? 'Remove Admin' : 'Make Admin'}
          </button>
        </div>
      </td>
    </tr>
  );
}
