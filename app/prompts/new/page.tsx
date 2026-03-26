import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { NewPromptClient } from '@/components/prompts/NewPromptClient';
import { PromptType } from '@/types';

export default async function NewPromptPage({
  searchParams,
}: {
  searchParams: { import?: string; type?: string; content?: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/prompts/new');
  }

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('name');

  const defaultType: PromptType =
    searchParams.type === 'prompt' ? 'prompt' : 'skill';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">
          {defaultType === 'skill' ? 'Submit a Claude Skill' : 'Submit a General Prompt'}
        </h1>
        <p className="text-muted-foreground mt-1">
          {defaultType === 'skill'
            ? 'Share a system prompt, agent definition, or reasoning framework for Claude or OpenClaw.'
            : 'Share a prompt that works across any AI model.'}
        </p>
      </div>
      <NewPromptClient
        categories={categories || []}
        userId={user.id}
        defaultImport={searchParams.import === 'github'}
        defaultType={defaultType}
        defaultContent={searchParams.content ? decodeURIComponent(searchParams.content) : undefined}
      />
    </div>
  );
}
