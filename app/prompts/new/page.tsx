import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { NewPromptClient } from '@/components/prompts/NewPromptClient';

export default async function NewPromptPage({
  searchParams,
}: {
  searchParams: { import?: string };
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

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Submit a Prompt</h1>
        <p className="text-muted-foreground mt-1">
          Share your best prompts with the community. All submissions are automatically reviewed.
        </p>
      </div>
      <NewPromptClient
        categories={categories || []}
        userId={user.id}
        defaultImport={searchParams.import === 'github'}
      />
    </div>
  );
}
