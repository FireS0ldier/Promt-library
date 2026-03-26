'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { Profile } from '@/types';
import { cn } from '@/lib/utils';
import {
  BookOpen, Plus, Search, Moon, Sun, Menu, X,
  Shield, LogOut, User as UserIcon, ChevronDown,
  Sparkles, Github, Zap
} from 'lucide-react';
import { useTheme } from 'next-themes';

interface NavbarProps {
  user: User | null;
  profile: Profile | null;
}

export function Navbar({ user, profile }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
              PromptVault
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            <Link href="/prompts" className="px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
              Browse
            </Link>
            <Link href="/categories" className="px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
              Categories
            </Link>
            <Link href="/prompt-master" className="px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-yellow-500" />
              Prompt Master
            </Link>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            <Link href="/prompts" className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
              <Search className="w-4 h-4" />
              Search
            </Link>

            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {user ? (
              <>
                <Link
                  href="/prompts/new"
                  className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Submit Prompt
                </Link>

                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent transition-colors"
                  >
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={profile.full_name || 'User'}
                        className="w-7 h-7 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                        {(profile?.full_name || profile?.username || user.email || 'U')[0].toUpperCase()}
                      </div>
                    )}
                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-1 w-52 rounded-lg border bg-popover shadow-lg p-1 z-50">
                      <div className="px-3 py-2 text-xs text-muted-foreground border-b mb-1">
                        {profile?.full_name || profile?.username || user.email}
                      </div>
                      <Link
                        href="/profile"
                        className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-accent transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <UserIcon className="w-4 h-4" />
                        My Profile
                      </Link>
                      <Link
                        href="/prompts/new"
                        className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-accent transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Plus className="w-4 h-4" />
                        Submit Prompt
                      </Link>
                      <Link
                        href="/prompts/new?import=github"
                        className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-accent transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Github className="w-4 h-4" />
                        Import from GitHub
                      </Link>
                      {profile?.is_admin && (
                        <>
                          <div className="my-1 border-t" />
                          <Link
                            href="/admin"
                            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-accent transition-colors text-violet-600 dark:text-violet-400"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <Shield className="w-4 h-4" />
                            Admin Panel
                          </Link>
                        </>
                      )}
                      <div className="my-1 border-t" />
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-destructive hover:text-destructive-foreground transition-colors text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <Link
                href="/login"
                className="px-4 py-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Sign In
              </Link>
            )}

            {/* Mobile menu toggle */}
            <button
              className="md:hidden p-2 rounded-md hover:bg-accent transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t bg-background px-4 py-3 space-y-1">
          <Link href="/prompts" className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-accent transition-colors" onClick={() => setMobileOpen(false)}>
            <Search className="w-4 h-4" /> Browse Prompts
          </Link>
          <Link href="/categories" className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-accent transition-colors" onClick={() => setMobileOpen(false)}>
            <BookOpen className="w-4 h-4" /> Categories
          </Link>
          <Link href="/prompt-master" className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-accent transition-colors" onClick={() => setMobileOpen(false)}>
            <Zap className="w-4 h-4 text-yellow-500" /> Prompt Master
          </Link>
          {user && (
            <Link href="/prompts/new" className="flex items-center gap-2 px-3 py-2 rounded-md text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors" onClick={() => setMobileOpen(false)}>
              <Plus className="w-4 h-4" /> Submit Prompt
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
