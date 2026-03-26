import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { PromptCard } from '@/components/prompts/PromptCard';
import { Prompt, Category, AIModel } from '@/types';
import { Search, SlidersHorizontal, BookOpen } from 'lucide-react';
import Link from 'next/link';

interface SearchParams {
  q?: string;
  category?: string;
  model?: string;
  sort?: string;
  page?: string;
  lang?: string;
}

export default async function PromptsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const supabase = createClient();

  const page = parseInt(searchParams.page || '1');
  const limit = 18;
  const offset = (page - 1) * limit;

  let query = supabase
    .from('prompts')
    .select('*, author:profiles(*), category:categories(*)', { count: 'exact' })
    .in('status', ['approved', 'official']);

  if (searchParams.q) {
    query = query.textSearch('title', searchParams.q, { type: 'websearch' });
  }
  if (searchParams.category) {
    query = query.eq('category_id', searchParams.category);
  }
  if (searchParams.model) {
    query = query.eq('ai_model', searchParams.model);
  }
  if (searchParams.lang) {
    query = query.eq('language', searchParams.lang);
  }

  const sortMap: Record<string, { column: string; ascending: boolean }> = {
    newest: { column: 'created_at', ascending: false },
    oldest: { column: 'created_at', ascending: true },
    most_liked: { column: 'like_count', ascending: false },
    most_viewed: { column: 'view_count', ascending: false },
    top_rated: { column: 'verification_score', ascending: false },
  };

  const sort = sortMap[searchParams.sort || 'newest'];
  query = query.order(sort.column, { ascending: sort.ascending });
  query = query.range(offset, offset + limit - 1);

  const [{ data: prompts, count }, { data: categories }] = await Promise.all([
    query,
    supabase.from('categories').select('*').order('name'),
  ]);

  const totalPages = Math.ceil((count || 0) / limit);

  const models = [
    { value: 'claude', label: 'Claude' },
    { value: 'chatgpt', label: 'ChatGPT' },
    { value: 'gemini', label: 'Gemini' },
    { value: 'grok', label: 'Grok' },
    { value: 'openclaw', label: 'OpenClaw' },
  ];

  const sorts = [
    { value: 'newest', label: 'Newest' },
    { value: 'most_liked', label: 'Most Liked' },
    { value: 'most_viewed', label: 'Most Viewed' },
    { value: 'top_rated', label: 'Top Rated' },
  ];

  function buildUrl(params: Partial<SearchParams>) {
    const merged = { ...searchParams, ...params };
    const urlParams = new URLSearchParams();
    Object.entries(merged).forEach(([k, v]) => {
      if (v) urlParams.set(k, v);
    });
    return `/prompts?${urlParams.toString()}`;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Browse Prompts</h1>
        <p className="text-muted-foreground">
          {count?.toLocaleString() || 0} verified prompts across all AI models
        </p>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        {/* Search */}
        <form action="/prompts" method="get" className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              name="q"
              defaultValue={searchParams.q}
              placeholder="Search prompts..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            {searchParams.category && <input type="hidden" name="category" value={searchParams.category} />}
            {searchParams.model && <input type="hidden" name="model" value={searchParams.model} />}
            {searchParams.sort && <input type="hidden" name="sort" value={searchParams.sort} />}
          </div>
        </form>

        {/* Model Filter */}
        <div className="flex flex-wrap gap-2 items-center">
          <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
          {models.map(m => (
            <Link
              key={m.value}
              href={buildUrl({ model: searchParams.model === m.value ? undefined : m.value, page: '1' })}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                searchParams.model === m.value
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background hover:bg-accent'
              }`}
            >
              {m.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="flex gap-8">
        {/* Sidebar: Categories */}
        <aside className="hidden lg:block w-56 shrink-0">
          <div className="sticky top-20">
            <h3 className="font-semibold text-sm mb-3 text-muted-foreground uppercase tracking-wide">Categories</h3>
            <nav className="space-y-0.5">
              <Link
                href={buildUrl({ category: undefined, page: '1' })}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  !searchParams.category ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-accent text-muted-foreground'
                }`}
              >
                All Categories
              </Link>
              {categories?.map((cat: Category) => (
                <Link
                  key={cat.id}
                  href={buildUrl({ category: cat.id, page: '1' })}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    searchParams.category === cat.id ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-accent text-muted-foreground'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span className="line-clamp-1">{cat.name}</span>
                </Link>
              ))}
            </nav>

            <div className="mt-6">
              <h3 className="font-semibold text-sm mb-3 text-muted-foreground uppercase tracking-wide">Sort By</h3>
              <nav className="space-y-0.5">
                {sorts.map(s => (
                  <Link
                    key={s.value}
                    href={buildUrl({ sort: s.value, page: '1' })}
                    className={`flex items-center px-3 py-2 rounded-lg text-sm transition-colors ${
                      (searchParams.sort || 'newest') === s.value ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-accent text-muted-foreground'
                    }`}
                  >
                    {s.label}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {prompts && prompts.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {prompts.map((prompt: Prompt) => (
                  <PromptCard key={prompt.id} prompt={prompt} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-10">
                  {page > 1 && (
                    <Link href={buildUrl({ page: String(page - 1) })} className="px-4 py-2 rounded-lg border hover:bg-accent text-sm transition-colors">
                      Previous
                    </Link>
                  )}
                  <span className="text-sm text-muted-foreground px-3">
                    Page {page} of {totalPages}
                  </span>
                  {page < totalPages && (
                    <Link href={buildUrl({ page: String(page + 1) })} className="px-4 py-2 rounded-lg border hover:bg-accent text-sm transition-colors">
                      Next
                    </Link>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20 text-muted-foreground">
              <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">No prompts found</p>
              <p className="text-sm mt-1">
                {searchParams.q ? `No results for "${searchParams.q}"` : 'Be the first to submit a prompt in this category!'}
              </p>
              <Link href="/prompts/new" className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium">
                Submit a Prompt
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
