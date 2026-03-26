import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PromptCard } from '@/components/prompts/PromptCard';
import { Prompt } from '@/types';
import { formatDate } from '@/lib/utils';
import { FileText, Heart, Calendar } from 'lucide-react';

export default async function ProfilePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login?redirect=/profile');

  const [{ data: profile }, { data: myPrompts }, { data: likedPrompts }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase
      .from('prompts')
      .select('*, author:profiles(*), category:categories(*)')
      .eq('author_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('likes')
      .select('prompt:prompts(*, author:profiles(*), category:categories(*))')
      .eq('user_id', user.id)
      .limit(12),
  ]);

  const likedPromptList = likedPrompts?.map((l: any) => l.prompt).filter(Boolean) || [];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Profile Header */}
      <div className="flex items-center gap-5 mb-10">
        {profile?.avatar_url ? (
          <img src={profile.avatar_url} alt="" className="w-16 h-16 rounded-full object-cover" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white text-2xl font-bold">
            {(profile?.full_name || user.email || 'U')[0].toUpperCase()}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold">{profile?.full_name || 'Your Profile'}</h1>
          {profile?.username && <p className="text-muted-foreground">@{profile.username}</p>}
          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Joined {formatDate(profile?.created_at || '')}</span>
            <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> {myPrompts?.length || 0} prompts</span>
          </div>
        </div>
      </div>

      {/* My Prompts */}
      <div className="mb-10">
        <h2 className="text-xl font-bold mb-5 flex items-center gap-2">
          <FileText className="w-5 h-5" /> My Prompts ({myPrompts?.length || 0})
        </h2>
        {myPrompts && myPrompts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {myPrompts.map((prompt: Prompt) => (
              <PromptCard key={prompt.id} prompt={prompt} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8">No prompts yet. <a href="/prompts/new" className="text-primary hover:underline">Submit your first one!</a></p>
        )}
      </div>

      {/* Liked Prompts */}
      {likedPromptList.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-5 flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-500" /> Liked Prompts ({likedPromptList.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {likedPromptList.map((prompt: Prompt) => (
              <PromptCard key={prompt.id} prompt={prompt} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
