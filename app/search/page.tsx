import { createClient } from '@/lib/supabase/server';
import { PromptCard } from '@/components/prompts/PromptCard';
import { SearchPageClient } from '@/components/search/SearchPageClient';
import { Prompt, Category } from '@/types';
import { Search, Cpu, BookOpen } from 'lucide-react';
import Link from 'next/link';

interface SearchParams {
  q?: string;
  type?: string;
  category?: string;
  model?: string;
  sort?: string;
  page?: string;
}

export const metadata = {
  title: 'Search — PromptVault',
  description: 'Search across all skills and prompts on PromptVault. Find system prompts, agent definitions, reasoning frameworks, and more.',
};

export default async function SearchPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = createClient();

  const page = parseInt(searchParams.page || '1');
  const limit = 18;
  const offset = (page - 1) * limit;
  const activeType = searchParams.type || 'all';

  let query = supabase
    .from('prompts')
    .select('*, author:profiles(*), category:categories(*)', { count: 'exact' })
    .in('status', ['approved', 'official']);

  // Type filter
  if (activeType === 'skill') {
    query = query.eq('type', 'skill');
  } else if (activeType === 'prompt') {
    query = query.eq('type', 'prompt');
  }

  // Text search: use textSearch on title for ranked results, plus ilike on description for broader matches
  if (searchParams.q) {
    query = query.or(
      `title.wfts.${searchParams.q},description.ilike.%${searchParams.q}%`
    );
  }

  if (searchParams.category) {
    query = query.eq('category_id', searchParams.category);
  }
  if (searchParams.model) {
    query = query.eq('ai_model', searchParams.model);
  }

  const sortMap: Record<string, { column: string; ascending: boolean }> = {
    newest:      { column: 'created_at',         ascending: false },
    most_liked:  { column: 'like_count',         ascending: false },
    most_viewed: { column: 'view_count',         ascending: false },
    top_rated:   { column: 'verification_score', ascending: false },
  };
  const sort = sortMap[searchParams.sort || 'newest'];
  query = query.order(sort.column, { ascending: sort.ascending }).range(offset, offset + limit - 1);

  const [{ data: results, count }, { data: categories }] = await Promise.all([
    query,
    supabase.from('categories').select('*').order('name'),
  ]);

  const totalPages = Math.ceil((count || 0) / limit);

  function buildUrl(params: Partial<SearchParams>) {
    const merged = { ...searchParams, ...params };
    const urlParams = new URLSearchParams();
    Object.entries(merged).forEach(([k, v]) => { if (v) urlParams.set(k, v as string); });
    return `/search?${urlParams.toString()}`;
  }

  const typeTabs = [
    { value: 'all',    label: 'All',     icon: Search },
    { value: 'skill',  label: 'Skills',  icon: Cpu },
    { value: 'prompt', label: 'Prompts', icon: BookOpen },
  ];

  const sorts = [
    { value: 'newest',      label: 'Newest' },
    { value: 'most_liked',  label: 'Most Liked' },
    { value: 'most_viewed', label: 'Most Viewed' },
    { value: 'top_rated',   label: 'Top Rated' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm font-medium text-orange-600 dark:text-orange-400 mb-2">
          <Search className="w-4 h-4" />
          Global Search
        </div>
        <h1 className="text-3xl font-bold mb-2">Search</h1>
        <p className="text-muted-foreground">
          Search across all skills and prompts on PromptVault
        </p>
      </div>

      {/* Search Input (client component) */}
      <div className="mb-6">
        <SearchPageClient />
      </div>

      {/* Type Tabs */}
      <div className="flex items-center gap-1 mb-8 border-b">
        {typeTabs.map(tab => {
          const isActive = activeType === tab.value;
          const TabIcon = tab.icon;
          return (
            <Link
              key={tab.value}
              href={buildUrl({ type: tab.value === 'all' ? undefined : tab.value, page: '1' })}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                isActive
                  ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'
              }`}
            >
              <TabIcon className="w-3.5 h-3.5" />
              {tab.label}
            </Link>
          );
        })}
        {/* Result count next to tabs */}
        <span className="ml-auto text-sm text-muted-foreground py-2.5">
          {count?.toLocaleString() || 0} result{count !== 1 ? 's' : ''}
          {searchParams.q ? ` for "${searchParams.q}"` : ''}
        </span>
      </div>

      <div className="flex gap-8">
        {/* Sidebar */}
        <aside className="hidden lg:block w-56 shrink-0">
          <div className="sticky top-20 space-y-6">
            {/* Categories */}
            <div>
              <h3 className="font-semibold text-xs mb-3 text-muted-foreground uppercase tracking-wide">Categories</h3>
              <nav className="space-y-0.5">
                <Link
                  href={buildUrl({ category: undefined, page: '1' })}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    !searchParams.category
                      ? 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 font-medium'
                      : 'hover:bg-accent text-muted-foreground'
                  }`}
                >
                  All Categories
                </Link>
                {categories?.map((cat: Category) => (
                  <Link
                    key={cat.id}
                    href={buildUrl({ category: cat.id, page: '1' })}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                      searchParams.category === cat.id
                        ? 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 font-medium'
                        : 'hover:bg-accent text-muted-foreground'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span className="line-clamp-1">{cat.name}</span>
                  </Link>
                ))}
              </nav>
            </div>

            {/* Sort */}
            <div>
              <h3 className="font-semibold text-xs mb-3 text-muted-foreground uppercase tracking-wide">Sort By</h3>
              <nav className="space-y-0.5">
                {sorts.map(s => (
                  <Link
                    key={s.value}
                    href={buildUrl({ sort: s.value, page: '1' })}
                    className={`flex items-center px-3 py-2 rounded-lg text-sm transition-colors ${
                      (searchParams.sort || 'newest') === s.value
                        ? 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 font-medium'
                        : 'hover:bg-accent text-muted-foreground'
                    }`}
                  >
                    {s.label}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </aside>

        {/* Results Grid */}
        <div className="flex-1 min-w-0">
          {results && results.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {results.map((item: Prompt) => (
                  <PromptCard key={item.id} prompt={item} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-10">
                  {page > 1 && (
                    <Link href={buildUrl({ page: String(page - 1) })} className="px-4 py-2 rounded-lg border hover:bg-accent text-sm">
                      Previous
                    </Link>
                  )}
                  <span className="text-sm text-muted-foreground px-3">Page {page} of {totalPages}</span>
                  {page < totalPages && (
                    <Link href={buildUrl({ page: String(page + 1) })} className="px-4 py-2 rounded-lg border hover:bg-accent text-sm">
                      Next
                    </Link>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20 text-muted-foreground border rounded-xl bg-muted/20">
              <Search className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">No results found</p>
              <p className="text-sm mt-1">
                {searchParams.q
                  ? `No matches for "${searchParams.q}". Try different keywords or broaden your filters.`
                  : 'Enter a search term to find skills and prompts.'}
              </p>
              <div className="mt-4 flex items-center justify-center gap-3">
                <Link href="/skills" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-accent text-sm font-medium">
                  <Cpu className="w-4 h-4 text-orange-500" /> Browse Skills
                </Link>
                <Link href="/prompts" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-accent text-sm font-medium">
                  <BookOpen className="w-4 h-4" /> Browse Prompts
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
