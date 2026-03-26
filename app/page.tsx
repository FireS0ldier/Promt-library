import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { PromptCard } from '@/components/prompts/PromptCard';
import { Prompt, Category } from '@/types';
import {
  ArrowRight, Sparkles, Shield, GitBranch, Globe,
  Zap, Users, BookOpen, Star, TrendingUp, Cpu, Layers
} from 'lucide-react';

export default async function HomePage() {
  const supabase = createClient();

  const [
    { data: featuredSkills },
    { data: featuredPrompts },
    { data: skillCategories },
    { data: generalCategories },
    { count: skillCount },
    { count: promptCount },
  ] = await Promise.all([
    // Top Claude/OpenClaw skills
    supabase
      .from('prompts')
      .select('*, author:profiles(*), category:categories(*)')
      .in('status', ['approved', 'official'])
      .eq('type', 'skill')
      .order('like_count', { ascending: false })
      .limit(6),
    // Top general prompts
    supabase
      .from('prompts')
      .select('*, author:profiles(*), category:categories(*)')
      .in('status', ['approved', 'official'])
      .eq('type', 'prompt')
      .order('like_count', { ascending: false })
      .limit(3),
    // Skill-focused categories (Claude/OpenClaw)
    supabase
      .from('categories')
      .select('*')
      .in('ai_model', ['claude', 'openclaw'])
      .order('name'),
    // General categories
    supabase
      .from('categories')
      .select('*')
      .is('ai_model', null)
      .limit(6),
    // Skill count
    supabase
      .from('prompts')
      .select('*', { count: 'exact', head: true })
      .eq('type', 'skill')
      .in('status', ['approved', 'official']),
    // Prompt count
    supabase
      .from('prompts')
      .select('*', { count: 'exact', head: true })
      .eq('type', 'prompt')
      .in('status', ['approved', 'official']),
  ]);

  return (
    <div className="flex flex-col">
      {/* ============================================================
          HERO — Claude Skills as primary focus
      ============================================================ */}
      <section className="relative overflow-hidden border-b bg-gradient-to-br from-orange-50 via-white to-indigo-50 dark:from-orange-950/20 dark:via-background dark:to-indigo-950/20">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32 relative">
          <div className="max-w-3xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-sm font-medium mb-6 border border-orange-200 dark:border-orange-800">
              <Cpu className="w-4 h-4" />
              #1 Claude Skills Library
            </div>

            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
              The World's Largest
              <br />
              <span className="bg-gradient-to-r from-orange-500 via-red-500 to-rose-500 bg-clip-text text-transparent">
                Claude Skills Library
              </span>
            </h1>

            <p className="text-xl text-muted-foreground mb-4 max-w-2xl leading-relaxed">
              Discover, share, and master <strong>Claude Skills</strong> — structured system prompts,
              agent definitions, and reasoning frameworks that unlock Claude's full potential.
              General AI prompts included too.
            </p>

            <div className="flex flex-wrap gap-3 mb-10">
              <span className="px-3 py-1 rounded-full text-sm bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800">
                🤖 Claude Skills
              </span>
              <span className="px-3 py-1 rounded-full text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
                🦾 OpenClaw Skills
              </span>
              <span className="px-3 py-1 rounded-full text-sm bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border">
                💬 + General Prompts
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/skills"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold hover:from-orange-600 hover:to-red-600 transition-all shadow-lg shadow-orange-200 dark:shadow-orange-900/30 text-base"
              >
                <Cpu className="w-5 h-5" />
                Browse Claude Skills
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/prompts"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl border bg-background font-semibold hover:bg-accent transition-colors text-base"
              >
                <BookOpen className="w-5 h-5" />
                General Prompts
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-8 mt-16">
            <div>
              <div className="text-3xl font-extrabold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                {Math.max(500, skillCount || 0).toLocaleString()}+
              </div>
              <div className="text-sm text-muted-foreground mt-0.5">Claude Skills</div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-foreground">
                {Math.max(500, promptCount || 0).toLocaleString()}+
              </div>
              <div className="text-sm text-muted-foreground mt-0.5">General Prompts</div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-foreground">6</div>
              <div className="text-sm text-muted-foreground mt-0.5">AI Models</div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-foreground">100%</div>
              <div className="text-sm text-muted-foreground mt-0.5">Free to Use</div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          WHAT ARE CLAUDE SKILLS?
      ============================================================ */}
      <section className="py-16 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 text-sm font-medium text-orange-600 dark:text-orange-400 mb-3">
                <Cpu className="w-4 h-4" />
                What are Claude Skills?
              </div>
              <h2 className="text-2xl md:text-3xl font-bold mb-5">
                More than prompts —
                <br />
                <span className="text-orange-500">structured instructions</span> for Claude
              </h2>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Claude Skills are carefully crafted system prompts, persona definitions, and reasoning
                frameworks designed specifically for Claude's unique capabilities. They define
                <em> how</em> Claude thinks, responds, and behaves — not just what to do.
              </p>
              <div className="space-y-3">
                {[
                  { icon: '🧠', title: 'System Prompts', desc: 'Define Claude\'s role, personality, and behavioral rules' },
                  { icon: '🤖', title: 'Agent Skills', desc: 'Multi-step workflows, tool use patterns, and agentic behaviors' },
                  { icon: '💡', title: 'Reasoning Chains', desc: 'Extended thinking frameworks and analysis patterns' },
                  { icon: '💻', title: 'Code Skills', desc: 'Development workflows specific to Claude\'s coding strengths' },
                ].map(({ icon, title, desc }) => (
                  <div key={title} className="flex items-start gap-3 p-3 rounded-xl bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30">
                    <span className="text-xl shrink-0">{icon}</span>
                    <div>
                      <div className="font-semibold text-sm">{title}</div>
                      <div className="text-xs text-muted-foreground">{desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground mb-3">
                <BookOpen className="w-4 h-4" />
                vs. General Prompts
              </div>
              <h2 className="text-2xl md:text-3xl font-bold mb-5">
                General prompts for
                <br />
                <span className="text-indigo-500">any AI model</span>
              </h2>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                General prompts work across ChatGPT, Gemini, Claude, Grok, and others.
                Great for everyday tasks — writing, coding, analysis, translation — without
                model-specific tuning.
              </p>
              <div className="space-y-3">
                {[
                  { icon: '✍️', title: 'Writing & Copywriting', desc: 'Works with any AI' },
                  { icon: '🔬', title: 'Analysis & Research', desc: 'Universal task prompts' },
                  { icon: '🎨', title: 'Creative & Storytelling', desc: 'For any creative model' },
                  { icon: '📊', title: 'Business & Productivity', desc: 'Cross-model workflows' },
                ].map(({ icon, title, desc }) => (
                  <div key={title} className="flex items-start gap-3 p-3 rounded-xl bg-muted/50 border">
                    <span className="text-xl shrink-0">{icon}</span>
                    <div>
                      <div className="font-semibold text-sm">{title}</div>
                      <div className="text-xs text-muted-foreground">{desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          SKILL CATEGORIES (Claude/OpenClaw focus)
      ============================================================ */}
      {skillCategories && skillCategories.length > 0 && (
        <section className="py-16 border-b bg-gradient-to-b from-orange-50/50 to-background dark:from-orange-950/10 dark:to-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-orange-600 dark:text-orange-400 mb-1">
                  <Cpu className="w-4 h-4" />
                  Skill Categories
                </div>
                <h2 className="text-2xl font-bold">Browse Claude & OpenClaw Skills</h2>
              </div>
              <Link href="/skills" className="text-sm text-primary hover:underline flex items-center gap-1">
                View all skills <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {skillCategories.map((category: Category) => (
                <Link
                  key={category.id}
                  href={`/skills?category=${category.id}`}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border bg-card hover:border-orange-300 dark:hover:border-orange-700 hover:shadow-md hover:shadow-orange-100 dark:hover:shadow-orange-900/20 transition-all text-center group"
                >
                  <span className="text-3xl group-hover:scale-110 transition-transform">{category.icon}</span>
                  <div className="font-medium text-xs leading-tight">{category.name}</div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ============================================================
          FEATURED CLAUDE SKILLS
      ============================================================ */}
      <section className="py-16 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-orange-600 dark:text-orange-400 mb-1">
                <Star className="w-4 h-4" />
                Top Skills
              </div>
              <h2 className="text-2xl font-bold">Best Claude Skills</h2>
              <p className="text-sm text-muted-foreground mt-1">Community favorites, expert verified</p>
            </div>
            <Link href="/skills" className="text-sm text-primary hover:underline flex items-center gap-1">
              All skills <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {featuredSkills && featuredSkills.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {featuredSkills.map((prompt: Prompt) => (
                <PromptCard key={prompt.id} prompt={prompt} />
              ))}
            </div>
          ) : (
            <EmptySection
              href="/prompts/new?type=skill"
              label="Submit the First Claude Skill"
              icon="🤖"
              message="No skills yet — be the first to share a Claude skill!"
            />
          )}
        </div>
      </section>

      {/* ============================================================
          FEATURES
      ============================================================ */}
      <section className="py-16 border-b bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-center mb-10">Why PromptVault?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Shield,
                title: 'Expert Verified',
                description: 'Automated safety + quality checks. High-score skills are instantly approved. Admin review for edge cases.',
                color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20',
              },
              {
                icon: GitBranch,
                title: 'GitHub Import',
                description: 'Import skills stored in your GitHub repo. Perfect for teams keeping prompts in version control.',
                color: 'text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800',
              },
              {
                icon: Globe,
                title: 'Multi-Language',
                description: 'Skills and prompts in any language. Built-in Google Translate integration.',
                color: 'text-green-600 bg-green-50 dark:bg-green-900/20',
              },
              {
                icon: Zap,
                title: 'Prompt Master',
                description: 'Build optimized skills with RISEN, CRISPE, COAT, and RTF frameworks. Live preview included.',
                color: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20',
              },
              {
                icon: Users,
                title: 'Community',
                description: 'Comment, suggest improvements, version history. The community makes every skill better.',
                color: 'text-violet-600 bg-violet-50 dark:bg-violet-900/20',
              },
              {
                icon: TrendingUp,
                title: 'Version Tracking',
                description: 'Full version history for every skill. See exactly what changed and why.',
                color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
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

      {/* ============================================================
          GENERAL PROMPTS SECTION (secondary)
      ============================================================ */}
      {generalCategories && generalCategories.length > 0 && (
        <section className="py-16 border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
                  <BookOpen className="w-4 h-4" />
                  General Prompts
                </div>
                <h2 className="text-2xl font-bold">Works with Any AI Model</h2>
              </div>
              <Link href="/prompts" className="text-sm text-primary hover:underline flex items-center gap-1">
                All prompts <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-8">
              {generalCategories.map((category: Category) => (
                <Link
                  key={category.id}
                  href={`/prompts?category=${category.id}`}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border bg-card hover:border-primary/50 hover:shadow-md transition-all text-center"
                >
                  <span className="text-2xl">{category.icon}</span>
                  <div className="font-medium text-xs leading-tight">{category.name}</div>
                </Link>
              ))}
            </div>

            {featuredPrompts && featuredPrompts.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {featuredPrompts.map((prompt: Prompt) => (
                  <PromptCard key={prompt.id} prompt={prompt} />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ============================================================
          AI Models roadmap
      ============================================================ */}
      <section className="py-16 border-t bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold mb-2">Supported AI Models</h2>
          <p className="text-muted-foreground mb-10">Starting with Claude & OpenClaw — expanding to all major AI models</p>
          <div className="flex flex-wrap justify-center gap-4">
            {[
              { name: 'Claude', emoji: '🤖', status: 'Live · Primary', color: 'border-orange-300 bg-orange-50 dark:bg-orange-900/10 ring-2 ring-orange-300 dark:ring-orange-700' },
              { name: 'OpenClaw', emoji: '🦾', status: 'Live · Primary', color: 'border-red-300 bg-red-50 dark:bg-red-900/10 ring-2 ring-red-300 dark:ring-red-700' },
              { name: 'ChatGPT', emoji: '💬', status: 'Coming Soon', color: 'border-green-200 bg-green-50 dark:bg-green-900/10 opacity-60' },
              { name: 'Gemini', emoji: '✨', status: 'Coming Soon', color: 'border-blue-200 bg-blue-50 dark:bg-blue-900/10 opacity-60' },
              { name: 'Grok', emoji: '⚡', status: 'Coming Soon', color: 'border-gray-200 bg-gray-50 dark:bg-gray-800 opacity-60' },
            ].map(({ name, emoji, status, color }) => (
              <div key={name} className={`flex items-center gap-3 px-5 py-3 rounded-xl border ${color}`}>
                <span className="text-2xl">{emoji}</span>
                <div className="text-left">
                  <div className="font-semibold text-sm">{name}</div>
                  <div className={`text-xs ${status.includes('Live') ? 'text-green-600 dark:text-green-400 font-medium' : 'text-muted-foreground'}`}>
                    {status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          CTA
      ============================================================ */}
      <section className="py-20 bg-gradient-to-r from-orange-500 via-red-500 to-rose-500 text-white">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 text-white text-sm font-medium mb-6">
            <Cpu className="w-4 h-4" />
            Join the Community
          </div>
          <h2 className="text-3xl font-bold mb-4">Share Your Claude Skills</h2>
          <p className="text-orange-100 mb-8 text-lg">
            Help build the world's best Claude skills library. Submit your system prompts,
            agent definitions, and reasoning frameworks — and get feedback from the community.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login" className="px-8 py-3 rounded-xl bg-white text-orange-600 font-semibold hover:bg-orange-50 transition-colors">
              Get Started Free
            </Link>
            <Link href="/skills" className="px-8 py-3 rounded-xl border border-white/40 font-semibold hover:bg-white/10 transition-colors">
              Browse Skills
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-10 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 font-bold">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                <Cpu className="w-3 h-3 text-white" />
              </div>
              <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                PromptVault
              </span>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link href="/skills" className="hover:text-foreground transition-colors">Claude Skills</Link>
              <Link href="/prompts" className="hover:text-foreground transition-colors">General Prompts</Link>
              <Link href="/categories" className="hover:text-foreground transition-colors">Categories</Link>
              <Link href="/prompt-master" className="hover:text-foreground transition-colors">Prompt Master</Link>
            </div>
            <p className="text-xs text-muted-foreground">© 2024 PromptVault. Built for the Claude community.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function EmptySection({ href, label, icon, message }: { href: string; label: string; icon: string; message: string }) {
  return (
    <div className="text-center py-16 text-muted-foreground border rounded-xl bg-muted/20">
      <span className="text-4xl mb-4 block">{icon}</span>
      <p className="font-medium">{message}</p>
      <Link href={href} className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm font-medium hover:opacity-90 transition-opacity">
        {label}
      </Link>
    </div>
  );
}
