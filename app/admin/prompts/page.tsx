import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { AdminPromptRow } from '@/components/admin/AdminPromptRow';
import { Shield, Search } from 'lucide-react';

interface SearchParams {
  status?: string;
  q?: string;
  page?: string;
}

export default async function AdminPromptsPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = createClient();
  const page = parseInt(searchParams.page || '1');
  const limit = 25;
  const offset = (page - 1) * limit;

  let query = supabase
    .from('prompts')
    .select('*, author:profiles(*), category:categories(*)', { count: 'exact' });

  if (searchParams.status && searchParams.status !== 'all') {
    query = query.eq('status', searchParams.status);
  }
  if (searchParams.q) {
    query = query.ilike('title', `%${searchParams.q}%`);
  }

  const { data: prompts, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  const totalPages = Math.ceil((count || 0) / limit);

  const statuses = [
    { value: 'all', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'official', label: 'Official' },
    { value: 'rejected', label: 'Rejected' },
  ];

  function buildUrl(params: Partial<SearchParams>) {
    const merged = { ...searchParams, ...params };
    const urlParams = new URLSearchParams();
    Object.entries(merged).forEach(([k, v]) => { if (v) urlParams.set(k, v); });
    return `/admin/prompts?${urlParams.toString()}`;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Manage Prompts</h1>
        <p className="text-muted-foreground mt-1">{count?.toLocaleString()} total prompts</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form action="/admin/prompts" method="get" className="flex gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              name="q"
              defaultValue={searchParams.q}
              placeholder="Search prompts..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            {searchParams.status && <input type="hidden" name="status" value={searchParams.status} />}
          </div>
        </form>

        <div className="flex gap-1.5 flex-wrap">
          {statuses.map(s => (
            <Link
              key={s.value}
              href={buildUrl({ status: s.value, page: '1' })}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                (searchParams.status || 'all') === s.value
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'hover:bg-accent'
              }`}
            >
              {s.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Title</th>
              <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Author</th>
              <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Model</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Score</th>
              <th className="text-right px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {prompts?.map((prompt: any) => (
              <AdminPromptRow key={prompt.id} prompt={prompt} />
            ))}
          </tbody>
        </table>

        {(!prompts || prompts.length === 0) && (
          <div className="text-center py-12 text-muted-foreground">
            No prompts found.
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          {page > 1 && (
            <Link href={buildUrl({ page: String(page - 1) })} className="px-4 py-2 rounded-lg border hover:bg-accent text-sm">
              Previous
            </Link>
          )}
          <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
          {page < totalPages && (
            <Link href={buildUrl({ page: String(page + 1) })} className="px-4 py-2 rounded-lg border hover:bg-accent text-sm">
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
