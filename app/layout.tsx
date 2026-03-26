import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/layout/ThemeProvider';
import { Navbar } from '@/components/layout/Navbar';
import { Toaster } from 'react-hot-toast';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'PromptVault — The World\'s Largest AI Prompt Library',
  description:
    'Discover, share, and master AI prompts for Claude, ChatGPT, Gemini, Grok, and more. Community-curated, expert-verified prompt library.',
  keywords: ['AI prompts', 'Claude prompts', 'ChatGPT prompts', 'prompt library', 'prompt engineering'],
  openGraph: {
    title: 'PromptVault — AI Prompt Library',
    description: 'The world\'s largest community-curated AI prompt library',
    type: 'website',
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let profile = null;
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    profile = data;
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <div className="min-h-screen bg-background">
            <Navbar user={user} profile={profile} />
            <main>{children}</main>
          </div>
          <Toaster
            position="bottom-right"
            toastOptions={{
              className: 'dark:bg-gray-800 dark:text-white',
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
