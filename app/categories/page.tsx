import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Category } from '@/types';
import { BookOpen } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Categories — PromptVault',
  description: 'Browse AI prompts by category and use case. Find prompts for coding, writing, marketing, education, and more.',
  openGraph: {
    title: 'Prompt Categories — PromptVault',
    description: 'Browse AI prompts by category and use case.',
    type: 'website',
  },
};

export default async function CategoriesPage() {
  const supabase = createClient();
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('name');

  // Get prompt counts per category
  const { data: promptCounts } = await supabase
    .from('prompts')
    .select('category_id')
    .in('status', ['approved', 'official']);

  const countMap: Record<string, number> = {};
  promptCounts?.forEach((p: any) => {
    if (p.category_id) countMap[p.category_id] = (countMap[p.category_id] || 0) + 1;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Categories</h1>
        <p className="text-muted-foreground mt-1">Browse prompts by category and use case</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {categories?.map((category: Category) => (
          <Link
            key={category.id}
            href={`/categories/${category.slug}`}
            className="group rounded-xl border bg-card p-5 hover:border-primary/50 hover:shadow-md transition-all"
          >
            <div className="flex items-start gap-4">
              <span className="text-3xl">{category.icon}</span>
              <div className="flex-1">
                <h3 className="font-semibold group-hover:text-primary transition-colors">{category.name}</h3>
                {category.description && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{category.description}</p>
                )}
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {countMap[category.id] || 0} prompts
                  </span>
                  {category.ai_model && (
                    <span className="px-2 py-0.5 rounded-full text-xs bg-secondary text-secondary-foreground capitalize">
                      {category.ai_model}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Link>
        ))}

        {(!categories || categories.length === 0) && (
          <div className="col-span-3 text-center py-16 text-muted-foreground">
            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>No categories yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
