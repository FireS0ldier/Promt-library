import { createClient } from '@/lib/supabase/server';
import { FileText, Users, CheckCircle, Clock, XCircle, Shield, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default async function AdminDashboard() {
  const supabase = createClient();

  const [
    { count: totalPrompts },
    { count: pendingPrompts },
    { count: approvedPrompts },
    { count: officialPrompts },
    { count: totalUsers },
    { data: recentPrompts },
  ] = await Promise.all([
    supabase.from('prompts').select('*', { count: 'exact', head: true }),
    supabase.from('prompts').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('prompts').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
    supabase.from('prompts').select('*', { count: 'exact', head: true }).eq('status', 'official'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase
      .from('prompts')
      .select('*, author:profiles(*)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(10),
  ]);

  const stats = [
    { label: 'Total Prompts', value: totalPrompts || 0, icon: FileText, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' },
    { label: 'Pending Review', value: pendingPrompts || 0, icon: Clock, color: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20', href: '/admin/prompts?status=pending' },
    { label: 'Approved', value: approvedPrompts || 0, icon: CheckCircle, color: 'text-green-600 bg-green-50 dark:bg-green-900/20' },
    { label: 'Official', value: officialPrompts || 0, icon: Shield, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' },
    { label: 'Total Users', value: totalUsers || 0, icon: Users, color: 'text-violet-600 bg-violet-50 dark:bg-violet-900/20', href: '/admin/users' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of PromptVault activity</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map(({ label, value, icon: Icon, color, href }) => {
          const card = (
            <div className="rounded-xl border bg-card p-5 hover:shadow-md transition-shadow">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="text-2xl font-bold">{value.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground mt-0.5">{label}</div>
            </div>
          );
          return href ? (
            <Link key={label} href={href}>{card}</Link>
          ) : (
            <div key={label}>{card}</div>
          );
        })}
      </div>

      {/* Pending Prompts */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg">Prompts Awaiting Review</h2>
          <Link href="/admin/prompts?status=pending" className="text-sm text-primary hover:underline">
            View all
          </Link>
        </div>

        {recentPrompts && recentPrompts.length > 0 ? (
          <div className="rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Title</th>
                  <th className="text-left px-4 py-3 font-medium">Author</th>
                  <th className="text-left px-4 py-3 font-medium">Model</th>
                  <th className="text-left px-4 py-3 font-medium">Score</th>
                  <th className="text-left px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {recentPrompts.map((prompt: any) => (
                  <tr key={prompt.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/prompts/${prompt.id}`} className="font-medium hover:text-primary line-clamp-1">
                        {prompt.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {prompt.author?.full_name || prompt.author?.username || 'Unknown'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-xs bg-secondary capitalize">
                        {prompt.ai_model}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-medium ${
                        prompt.verification_score >= 70 ? 'text-green-600' :
                        prompt.verification_score >= 40 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {prompt.verification_score}%
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <AdminPromptActions promptId={prompt.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-xl border bg-card p-10 text-center text-muted-foreground">
            <CheckCircle className="w-10 h-10 mx-auto mb-3 text-green-500" />
            <p className="font-medium">All caught up!</p>
            <p className="text-sm mt-1">No prompts pending review.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function AdminPromptActions({ promptId }: { promptId: string }) {
  return (
    <div className="flex items-center gap-2">
      <Link
        href={`/admin/prompts/${promptId}/review`}
        className="px-2.5 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
      >
        Review
      </Link>
    </div>
  );
}
