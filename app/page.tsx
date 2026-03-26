import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { PromptCard } from '@/components/prompts/PromptCard';
import { Prompt, Category } from '@/types';
import {
  ArrowRight, Sparkles, Shield, GitBranch, Globe,
  Zap, Users, BookOpen, Star, TrendingUp, Check
} from 'lucide-react';

export default async function HomePage() {
  const supabase = createClient();

  const [{ data: featuredPrompts }, { data: categories }, { data: stats }] = await Promise.all([
    supabase
      .from('prompts')
      .select('*, author:profiles(*), category:categories(*)')
      .in('status', ['approved', 'official'])
      .order('like_count', { ascending: false })
      .limit(6),
    supabase
      .from('categories')
      .select('*')
      .limit(8),
    supabase
      .from('prompts')
      .select('id', { count: 'exact', head: true })
      .in('status', ['approved', 'official']),
  ]);

  const promptCount = stats?.length ?? 0;

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-violet-50/50 to-background dark:from-violet-950/20 dark:to-background border-b">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32 text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            The World's Largest AI Prompt Library
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
            Find the Perfect Prompt
            <br />
            <span className="bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent">
              for Any AI Model
            </span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Discover, share, and master community-curated prompts for Claude, ChatGPT, Gemini, Grok, and more.
            Expert-verified and always growing.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/prompts"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors text-base"
            >
              Browse Prompts
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/prompt-master"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border bg-background font-semibold hover:bg-accent transition-colors text-base"
            >
              <Zap className="w-4 h-4 text-yellow-500" />
              Try Prompt Master
            </Link>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-8 mt-16 text-center">
            <div>
              <div className="text-3xl font-bold text-foreground">{Math.max(1000, promptCount).toLocaleString()}+</div>
              <div className="text-sm text-muted-foreground">Verified Prompts</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-foreground">12+</div>
              <div className="text-sm text-muted-foreground">Categories</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-foreground">6</div>
              <div className="text-sm text-muted-foreground">AI Models</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-foreground">100%</div>
              <div className="text-sm text-muted-foreground">Free to Use</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-center mb-10">Why PromptVault?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Shield,
                title: 'Expert Verified',
                description: 'Every prompt goes through automated safety checks and manual review before being marked as Official.',
                color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20',
              },
              {
                icon: GitBranch,
                title: 'GitHub Integration',
                description: 'Import prompts directly from your GitHub repositories. Keep your prompts in sync with your code.',
                color: 'text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800',
              },
              {
                icon: Globe,
                title: 'Multi-Language',
                description: 'Browse prompts in any language. Built-in translation support via Google Translate.',
                color: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20',
              },
              {
                icon: Zap,
                title: 'Prompt Master',
                description: 'AI-powered prompt builder that helps you craft perfect prompts with structure and best practices.',
                color: 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20',
              },
              {
                icon: Users,
                title: 'Community Driven',
                description: 'Submit, comment, and suggest improvements. The community makes every prompt better.',
                color: 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20',
              },
              {
                icon: TrendingUp,
                title: 'Version History',
                description: 'Track all changes to prompts over time. See what improved and why.',
                color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20',
              },
            ].map(({ icon: Icon, title, description, color }) => (
              <div key={title} className="rounded-xl border bg-card p-5 hover:shadow-md transition-shadow">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-base mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories && categories.length > 0 && (
        <section className="py-16 border-b bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold">Browse by Category</h2>
              <Link href="/categories" className="text-sm text-primary hover:underline flex items-center gap-1">
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {categories.map((category: Category) => (
                <Link
                  key={category.id}
                  href={`/categories/${category.slug}`}
                  className="flex items-center gap-3 p-4 rounded-xl border bg-card hover:border-primary/50 hover:shadow-md transition-all"
                >
                  <span className="text-2xl">{category.icon}</span>
                  <div>
                    <div className="font-medium text-sm">{category.name}</div>
                    {category.ai_model && (
                      <div className="text-xs text-muted-foreground capitalize">{category.ai_model}</div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Prompts */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold">Top Prompts</h2>
              <p className="text-sm text-muted-foreground mt-1">Most liked community favorites</p>
            </div>
            <Link href="/prompts" className="text-sm text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {featuredPrompts && featuredPrompts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {featuredPrompts.map((prompt: Prompt) => (
                <PromptCard key={prompt.id} prompt={prompt} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-muted-foreground">
              <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">No prompts yet</p>
              <p className="text-sm mt-1">Be the first to submit a prompt!</p>
              <Link href="/prompts/new" className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium">
                Submit First Prompt
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* AI Models Section */}
      <section className="py-16 border-t bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold mb-3">Supported AI Models</h2>
          <p className="text-muted-foreground mb-10">Starting with Claude, expanding to all major AI models</p>
          <div className="flex flex-wrap justify-center gap-4">
            {[
              { name: 'Claude', emoji: '🤖', status: 'Live', color: 'border-orange-300 bg-orange-50 dark:bg-orange-900/10' },
              { name: 'ChatGPT', emoji: '💬', status: 'Coming Soon', color: 'border-green-300 bg-green-50 dark:bg-green-900/10' },
              { name: 'Gemini', emoji: '✨', status: 'Coming Soon', color: 'border-blue-300 bg-blue-50 dark:bg-blue-900/10' },
              { name: 'Grok', emoji: '⚡', status: 'Coming Soon', color: 'border-gray-300 bg-gray-50 dark:bg-gray-800' },
              { name: 'OpenClaw', emoji: '🦾', status: 'Coming Soon', color: 'border-purple-300 bg-purple-50 dark:bg-purple-900/10' },
            ].map(({ name, emoji, status, color }) => (
              <div key={name} className={`flex items-center gap-2 px-5 py-3 rounded-xl border ${color}`}>
                <span className="text-xl">{emoji}</span>
                <div className="text-left">
                  <div className="font-semibold text-sm">{name}</div>
                  <div className={`text-xs ${status === 'Live' ? 'text-green-600 font-medium' : 'text-muted-foreground'}`}>
                    {status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-violet-600 to-indigo-600 text-white">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Share Your Prompts with the World</h2>
          <p className="text-violet-100 mb-8 text-lg">
            Join our community of prompt engineers. Submit your best prompts, get feedback, and help others unlock the full potential of AI.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login"
              className="px-8 py-3 rounded-lg bg-white text-violet-700 font-semibold hover:bg-violet-50 transition-colors"
            >
              Get Started — It's Free
            </Link>
            <Link
              href="/prompts"
              className="px-8 py-3 rounded-lg border border-white/40 font-semibold hover:bg-white/10 transition-colors"
            >
              Explore Library
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-10 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 font-bold">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
                <BookOpen className="w-3 h-3 text-white" />
              </div>
              <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                PromptVault
              </span>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link href="/prompts" className="hover:text-foreground transition-colors">Browse</Link>
              <Link href="/categories" className="hover:text-foreground transition-colors">Categories</Link>
              <Link href="/prompt-master" className="hover:text-foreground transition-colors">Prompt Master</Link>
              <Link href="/login" className="hover:text-foreground transition-colors">Sign In</Link>
            </div>
            <p className="text-xs text-muted-foreground">
              © 2024 PromptVault. Built for the AI community.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
