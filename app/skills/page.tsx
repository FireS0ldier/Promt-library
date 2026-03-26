import { createClient } from '@/lib/supabase/server';
import { PromptCard } from '@/components/prompts/PromptCard';
import { Prompt, Category } from '@/types';
import { Search, SlidersHorizontal, Cpu, BookOpen } from 'lucide-react';
import Link from 'next/link';

interface SearchParams {
  q?: string;
  category?: string;
  model?: string;
  sort?: string;
  page?: string;
}

export const metadata = {
  title: 'Claude Skills — PromptVault',
  description: 'Browse the world\'s largest collection of Claude Skills: system prompts, agent definitions, reasoning frameworks, and more.',
};

export default async function SkillsPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = createClient();

  const page = parseInt(searchParams.page || '1');
  const limit = 18;
  const offset = (page - 1) * limit;

  let query = supabase
    .from('prompts')
    .select('*, author:profiles(*), category:categories(*)', { count: 'exact' })
    .in('status', ['approved', 'official'])
    .eq('type', 'skill');

  if (searchParams.q) {
    query = query.textSearch('title', searchParams.q, { type: 'websearch' });
  }
  if (searchParams.category) {
    query = query.eq('category_id', searchParams.category);
  }
  if (searchParams.model) {
    query = query.eq('ai_model', searchParams.model);
  }

  const sortMap: Record<string, { column: string; ascending: boolean }> = {
    newest: { column: 'created_at', ascending: false },
    most_liked: { column: 'like_count', ascending: false },
    most_viewed: { column: 'view_count', ascending: false },
    top_rated: { column: 'verification_score', ascending: false },
  };
  const sort = sortMap[searchParams.sort || 'newest'];
  query = query.order(sort.column, { ascending: sort.ascending }).range(offset, offset + limit - 1);

  const [{ data: skills, count }, { data: skillCategories }] = await Promise.all([
    query,
    supabase
      .from('categories')
      .select('*')
      .in('ai_model', ['claude', 'openclaw'])
      .order('name'),
  ]);

  const totalPages = Math.ceil((count || 0) / limit);

  function buildUrl(params: Partial<SearchParams>) {
    const merged = { ...searchParams, ...params };
    const urlParams = new URLSearchParams();
    Object.entries(merged).forEach(([k, v]) => { if (v) urlParams.set(k, v); });
    return `/skills?${urlParams.toString()}`;
  }

  const models = [
    { value: 'claude', label: '🤖 Claude', active: 'bg-orange-500 text-white border-orange-500' },
    { value: 'openclaw', label: '🦾 OpenClaw', active: 'bg-red-500 text-white border-red-500' },
  ];

  const sorts = [
    { value: 'newest', label: 'Newest' },
    { value: 'most_liked', label: 'Most Liked' },
    { value: 'most_viewed', label: 'Most Viewed' },
    { value: 'top_rated', label: 'Top Rated' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm font-medium text-orange-600 dark:text-orange-400 mb-2">
          <Cpu className="w-4 h-4" />
          Claude & OpenClaw Skills
        </div>
        <h1 className="text-3xl font-bold mb-2">Browse Skills</h1>
        <p className="text-muted-foreground">
          {count?.toLocaleString() || 0} verified skills — system prompts, agent definitions, reasoning frameworks
        </p>
      </div>

      {/* Search + Model Filter */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <form action="/skills" method="get" className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              name="q"
              defaultValue={searchParams.q}
              placeholder="Search Claude skills..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/30"
            />
            {searchParams.category && <input type="hidden" name="category" value={searchParams.category} />}
            {searchParams.model && <input type="hidden" name="model" value={searchParams.model} />}
            {searchParams.sort && <input type="hidden" name="sort" value={searchParams.sort} />}
          </div>
        </form>

        <div className="flex items-center gap-2 flex-wrap">
          <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
          <Link
            href={buildUrl({ model: undefined, page: '1' })}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              !searchParams.model ? 'bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-gray-900' : 'hover:bg-accent'
            }`}
          >
            All Models
          </Link>
          {models.map(m => (
            <Link
              key={m.value}
              href={buildUrl({ model: searchParams.model === m.value ? undefined : m.value, page: '1' })}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                searchParams.model === m.value ? m.active : 'hover:bg-accent'
              }`}
            >
              {m.label}
            </Link>
          ))}

          <Link
            href="/prompts/new?type=skill"
            className="ml-2 px-3 py-1.5 rounded-full text-sm font-medium bg-gradient-to-r from-orange-500 to-red-500 text-white hover:opacity-90 transition-opacity"
          >
            + Submit Skill
          </Link>
        </div>
      </div>

      <div className="flex gap-8">
        {/* Sidebar */}
        <aside className="hidden lg:block w-56 shrink-0">
          <div className="sticky top-20 space-y-6">
            <div>
              <h3 className="font-semibold text-xs mb-3 text-muted-foreground uppercase tracking-wide">Skill Categories</h3>
              <nav className="space-y-0.5">
                <Link
                  href={buildUrl({ category: undefined, page: '1' })}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    !searchParams.category ? 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 font-medium' : 'hover:bg-accent text-muted-foreground'
                  }`}
                >
                  All Skills
                </Link>
                {skillCategories?.map((cat: Category) => (
                  <Link
                    key={cat.id}
                    href={buildUrl({ category: cat.id, page: '1' })}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                      searchParams.category === cat.id ? 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 font-medium' : 'hover:bg-accent text-muted-foreground'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span className="line-clamp-1">{cat.name}</span>
                  </Link>
                ))}
              </nav>
            </div>

            <div>
              <h3 className="font-semibold text-xs mb-3 text-muted-foreground uppercase tracking-wide">Sort By</h3>
              <nav className="space-y-0.5">
                {sorts.map(s => (
                  <Link
                    key={s.value}
                    href={buildUrl({ sort: s.value, page: '1' })}
                    className={`flex items-center px-3 py-2 rounded-lg text-sm transition-colors ${
                      (searchParams.sort || 'newest') === s.value ? 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 font-medium' : 'hover:bg-accent text-muted-foreground'
                    }`}
                  >
                    {s.label}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Cross-link to general prompts */}
            <div className="rounded-xl border bg-muted/50 p-4 text-center">
              <BookOpen className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
              <p className="text-xs text-muted-foreground mb-2">Looking for general prompts?</p>
              <Link href="/prompts" className="text-xs text-primary hover:underline font-medium">
                Browse All Prompts →
              </Link>
            </div>
          </div>
        </aside>

        {/* Grid */}
        <div className="flex-1 min-w-0">
          {skills && skills.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {skills.map((skill: Prompt) => (
                  <PromptCard key={skill.id} prompt={skill} />
                ))}
              </div>
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-10">
                  {page > 1 && (
                    <Link href={buildUrl({ page: String(page - 1) })} className="px-4 py-2 rounded-lg border hover:bg-accent text-sm">Previous</Link>
                  )}
                  <span className="text-sm text-muted-foreground px-3">Page {page} of {totalPages}</span>
                  {page < totalPages && (
                    <Link href={buildUrl({ page: String(page + 1) })} className="px-4 py-2 rounded-lg border hover:bg-accent text-sm">Next</Link>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20 text-muted-foreground border rounded-xl bg-muted/20">
              <Cpu className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">No skills found</p>
              <p className="text-sm mt-1">
                {searchParams.q ? `No results for "${searchParams.q}"` : 'Be the first to submit a Claude skill!'}
              </p>
              <Link href="/prompts/new?type=skill" className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm font-medium">
                Submit First Skill
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
