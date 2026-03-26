'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { Profile } from '@/types';
import { cn } from '@/lib/utils';
import {
  BookOpen, Plus, Search, Moon, Sun, Menu, X,
  Shield, LogOut, User as UserIcon, ChevronDown,
  Zap, Github, Cpu
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
  const pathname = usePathname();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  const navLinks = [
    {
      href: '/skills',
      label: 'Claude Skills',
      icon: Cpu,
      primary: true, // main focus
      activeMatch: '/skills',
    },
    {
      href: '/prompts',
      label: 'General Prompts',
      icon: BookOpen,
      primary: false,
      activeMatch: '/prompts',
    },
    {
      href: '/categories',
      label: 'Categories',
      icon: null,
      primary: false,
      activeMatch: '/categories',
    },
    {
      href: '/search',
      label: 'Search',
      icon: Search,
      primary: false,
      activeMatch: '/search',
    },
    {
      href: '/prompt-master',
      label: 'Prompt Master',
      icon: Zap,
      primary: false,
      activeMatch: '/prompt-master',
    },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-xl shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
              <Cpu className="w-4 h-4 text-white" />
            </div>
            <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
              PromptVault
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-0.5">
            {navLinks.map(({ href, label, icon: Icon, primary, activeMatch }) => {
              const isActive = pathname === activeMatch || pathname.startsWith(activeMatch + '/');
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5',
                    primary
                      ? isActive
                        ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                        : 'text-muted-foreground hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/10'
                      : isActive
                        ? 'bg-accent text-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  )}
                >
                  {Icon && (
                    <Icon className={cn(
                      'w-3.5 h-3.5',
                      primary ? 'text-orange-500' : href === '/prompt-master' ? 'text-yellow-500' : ''
                    )} />
                  )}
                  {label}
                  {primary && (
                    <span className="ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-500 text-white leading-none">
                      #1
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Search shortcut */}
            <Link
              href="/search"
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <Search className="w-4 h-4" />
              Search
            </Link>

            {/* Theme toggle */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {user ? (
              <>
                {/* Submit button */}
                <Link
                  href="/prompts/new"
                  className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  <Plus className="w-4 h-4" />
                  Submit
                </Link>

                {/* User dropdown */}
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
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white text-xs font-bold">
                        {(profile?.full_name || profile?.username || user.email || 'U')[0].toUpperCase()}
                      </div>
                    )}
                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground hidden sm:block" />
                  </button>

                  {userMenuOpen && (
                    <>
                      {/* Backdrop */}
                      <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                      <div className="absolute right-0 top-full mt-1 w-56 rounded-xl border bg-popover shadow-xl p-1.5 z-50">
                        <div className="px-3 py-2 text-xs text-muted-foreground border-b mb-1">
                          <div className="font-medium text-foreground truncate">
                            {profile?.full_name || profile?.username || 'User'}
                          </div>
                          <div className="truncate">{user.email}</div>
                        </div>

                        <Link href="/profile" onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-accent transition-colors">
                          <UserIcon className="w-4 h-4" /> My Profile
                        </Link>
                        <Link href="/prompts/new?type=skill" onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-accent transition-colors">
                          <Cpu className="w-4 h-4 text-orange-500" /> Submit Skill
                        </Link>
                        <Link href="/prompts/new?type=prompt" onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-accent transition-colors">
                          <BookOpen className="w-4 h-4" /> Submit Prompt
                        </Link>
                        <Link href="/prompts/new?import=github" onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-accent transition-colors">
                          <Github className="w-4 h-4" /> Import from GitHub
                        </Link>

                        {profile?.is_admin && (
                          <>
                            <div className="my-1 border-t" />
                            <Link href="/admin" onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-accent transition-colors text-violet-600 dark:text-violet-400">
                              <Shield className="w-4 h-4" /> Admin Panel
                            </Link>
                          </>
                        )}

                        <div className="my-1 border-t" />
                        <button
                          onClick={handleSignOut}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-destructive/10 hover:text-destructive transition-colors text-left"
                        >
                          <LogOut className="w-4 h-4" /> Sign Out
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <Link
                href="/login"
                className="px-4 py-1.5 rounded-md bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Sign In
              </Link>
            )}

            {/* Mobile toggle */}
            <button
              className="md:hidden p-2 rounded-md hover:bg-accent transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t bg-background px-4 py-3 space-y-1">
          <Link href="/skills"
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300"
            onClick={() => setMobileOpen(false)}>
            <Cpu className="w-4 h-4" /> Claude Skills
            <span className="ml-auto px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-500 text-white">#1</span>
          </Link>
          <Link href="/prompts"
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-accent transition-colors"
            onClick={() => setMobileOpen(false)}>
            <BookOpen className="w-4 h-4" /> General Prompts
          </Link>
          <Link href="/categories"
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-accent transition-colors"
            onClick={() => setMobileOpen(false)}>
            Categories
          </Link>
          <Link href="/search"
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-accent transition-colors"
            onClick={() => setMobileOpen(false)}>
            <Search className="w-4 h-4" /> Search
          </Link>
          <Link href="/prompt-master"
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-accent transition-colors"
            onClick={() => setMobileOpen(false)}>
            <Zap className="w-4 h-4 text-yellow-500" /> Prompt Master
          </Link>
          {user ? (
            <>
              <div className="border-t my-1" />
              <Link href="/prompts/new?type=skill"
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm bg-gradient-to-r from-orange-500 to-red-500 text-white font-medium"
                onClick={() => setMobileOpen(false)}>
                <Plus className="w-4 h-4" /> Submit Skill / Prompt
              </Link>
            </>
          ) : (
            <Link href="/login"
              className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm bg-gradient-to-r from-orange-500 to-red-500 text-white font-medium"
              onClick={() => setMobileOpen(false)}>
              Sign In
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
