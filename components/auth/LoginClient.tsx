'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { BookOpen, Github, Loader2, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  redirectTo?: string;
}

export function LoginClient({ redirectTo }: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const [emailMode, setEmailMode] = useState(false);
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const supabase = createClient();

  const redirectUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback${redirectTo ? `?redirect=${encodeURIComponent(redirectTo)}` : ''}`;

  const handleOAuth = async (provider: 'github' | 'google' | 'apple') => {
    setLoading(provider);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: redirectUrl,
      },
    });
    if (error) {
      toast.error(error.message);
      setLoading(null);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading('email');
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: redirectUrl },
    });
    if (error) {
      toast.error(error.message);
    } else {
      setEmailSent(true);
      toast.success('Magic link sent! Check your email.');
    }
    setLoading(null);
  };

  return (
    <div className="w-full max-w-sm">
      {/* Logo */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 mb-4">
          <BookOpen className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-2xl font-bold">Welcome to PromptVault</h1>
        <p className="text-muted-foreground mt-1 text-sm">Sign in to submit and manage prompts</p>
      </div>

      <div className="rounded-2xl border bg-card shadow-lg p-6 space-y-4">
        {emailSent ? (
          <div className="text-center py-4">
            <Mail className="w-12 h-12 text-primary mx-auto mb-3" />
            <h2 className="font-semibold text-lg">Check your email</h2>
            <p className="text-sm text-muted-foreground mt-1">
              We sent a magic link to <strong>{email}</strong>. Click it to sign in.
            </p>
            <button
              onClick={() => { setEmailSent(false); setEmail(''); }}
              className="mt-4 text-sm text-primary hover:underline"
            >
              Use a different email
            </button>
          </div>
        ) : emailMode ? (
          <form onSubmit={handleMagicLink} className="space-y-3">
            <div>
              <label className="text-sm font-medium block mb-1.5">Email address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-3 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <button
              type="submit"
              disabled={loading === 'email'}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-60"
            >
              {loading === 'email' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
              Send Magic Link
            </button>
            <button type="button" onClick={() => setEmailMode(false)} className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors">
              ← Back to options
            </button>
          </form>
        ) : (
          <>
            {/* GitHub */}
            <button
              onClick={() => handleOAuth('github')}
              disabled={!!loading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border bg-gray-950 text-white dark:bg-white dark:text-gray-900 font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading === 'github' ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Github className="w-5 h-5" />
              )}
              Continue with GitHub
            </button>

            {/* Google */}
            <button
              onClick={() => handleOAuth('google')}
              disabled={!!loading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border font-medium text-sm hover:bg-accent transition-colors disabled:opacity-50"
            >
              {loading === 'google' ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              Continue with Google
            </button>

            {/* Apple */}
            <button
              onClick={() => handleOAuth('apple')}
              disabled={!!loading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border bg-black text-white dark:bg-white dark:text-black font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading === 'apple' ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
              )}
              Continue with Apple
            </button>

            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs text-muted-foreground bg-card px-2">
                or
              </div>
            </div>

            <button
              onClick={() => setEmailMode(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border font-medium text-sm hover:bg-accent transition-colors"
            >
              <Mail className="w-4 h-4" />
              Continue with Email
            </button>
          </>
        )}
      </div>

      <p className="text-center text-xs text-muted-foreground mt-4">
        By signing in, you agree to our Terms of Service and Privacy Policy.
      </p>
    </div>
  );
}
