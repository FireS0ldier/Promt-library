import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { EditPromptClient } from '@/components/prompts/EditPromptClient';

export default async function EditPromptPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect(`/login?redirect=/prompts/${params.id}/edit`);

  const [{ data: prompt }, { data: categories }, { data: profile }] = await Promise.all([
    supabase
      .from('prompts')
      .select('*')
      .eq('id', params.id)
      .single(),
    supabase.from('categories').select('*').order('name'),
    supabase.from('profiles').select('is_admin').eq('id', user.id).single(),
  ]);

  if (!prompt) notFound();

  const isAuthor = prompt.author_id === user.id;
  const isAdmin  = profile?.is_admin ?? false;

  if (!isAuthor && !isAdmin) redirect(`/prompts/${params.id}`);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Edit {prompt.type === 'skill' ? 'Skill' : 'Prompt'}</h1>
        <p className="text-muted-foreground mt-1">
          Saving will create a new version and re-run verification.
        </p>
      </div>
      <EditPromptClient
        prompt={prompt}
        categories={categories || []}
        userId={user.id}
      />
    </div>
  );
}
