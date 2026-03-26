import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { PromptCard } from '@/components/prompts/PromptCard';
import { Prompt } from '@/types';
import Link from 'next/link';
import { ArrowLeft, BookOpen } from 'lucide-react';

export default async function CategoryPage({ params }: { params: { slug: string } }) {
  const supabase = createClient();

  const { data: category } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', params.slug)
    .single();

  if (!category) notFound();

  const { data: prompts } = await supabase
    .from('prompts')
    .select('*, author:profiles(*), category:categories(*)')
    .eq('category_id', category.id)
    .in('status', ['approved', 'official'])
    .order('like_count', { ascending: false });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href="/categories" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        All Categories
      </Link>

      <div className="flex items-center gap-4 mb-8">
        <span className="text-4xl">{category.icon}</span>
        <div>
          <h1 className="text-2xl font-bold">{category.name}</h1>
          {category.description && <p className="text-muted-foreground mt-0.5">{category.description}</p>}
          <p className="text-sm text-muted-foreground mt-1">{prompts?.length || 0} prompts</p>
        </div>
      </div>

      {prompts && prompts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {prompts.map((prompt: Prompt) => (
            <PromptCard key={prompt.id} prompt={prompt} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-muted-foreground">
          <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">No prompts yet in this category</p>
          <Link href="/prompts/new" className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium">
            Be the first to submit
          </Link>
        </div>
      )}
    </div>
  );
}
