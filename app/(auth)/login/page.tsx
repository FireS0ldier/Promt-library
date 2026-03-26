import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { LoginClient } from '@/components/auth/LoginClient';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { redirect?: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect(searchParams.redirect || '/');
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <LoginClient redirectTo={searchParams.redirect} />
    </div>
  );
}
