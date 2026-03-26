-- Enable necessary extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm"; -- for full-text search

-- ================================================================
-- PROFILES (extends auth.users)
-- ================================================================
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text unique,
  full_name text,
  avatar_url text,
  is_admin boolean default false,
  bio text,
  github_username text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by everyone" on public.profiles
  for select using (true);

create policy "Users can update their own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Users can insert their own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url, username)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'user_name'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ================================================================
-- CATEGORIES
-- ================================================================
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text,
  icon text,
  color text default '#6366f1',
  ai_model text, -- null = all models
  created_at timestamptz default now()
);

alter table public.categories enable row level security;

create policy "Categories are viewable by everyone" on public.categories
  for select using (true);

create policy "Only admins can manage categories" on public.categories
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

-- ================================================================
-- PROMPTS
-- ================================================================
create table public.prompts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  description text,
  author_id uuid references public.profiles(id) on delete set null,
  category_id uuid references public.categories(id) on delete set null,
  ai_model text not null default 'claude',
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'official')),
  language text not null default 'en',
  verification_score integer default 0,
  verification_results jsonb,
  tags text[] default '{}',
  github_url text,
  view_count integer default 0,
  like_count integer default 0,
  version integer default 1,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.prompts enable row level security;

create policy "Approved/official prompts are viewable by everyone" on public.prompts
  for select using (
    status in ('approved', 'official')
    or author_id = auth.uid()
    or exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

create policy "Authenticated users can create prompts" on public.prompts
  for insert with check (auth.uid() is not null and author_id = auth.uid());

create policy "Authors can update their own prompts" on public.prompts
  for update using (
    author_id = auth.uid()
    or exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

create policy "Authors can delete their own prompts" on public.prompts
  for delete using (
    author_id = auth.uid()
    or exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

-- Full text search index
create index prompts_search_idx on public.prompts
  using gin(to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(content, '')));

-- ================================================================
-- PROMPT VERSIONS
-- ================================================================
create table public.prompt_versions (
  id uuid primary key default gen_random_uuid(),
  prompt_id uuid references public.prompts(id) on delete cascade not null,
  content text not null,
  version_number integer not null,
  change_notes text,
  author_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now(),
  unique(prompt_id, version_number)
);

alter table public.prompt_versions enable row level security;

create policy "Versions of visible prompts are viewable" on public.prompt_versions
  for select using (
    exists (
      select 1 from public.prompts p
      where p.id = prompt_id
      and (p.status in ('approved', 'official') or p.author_id = auth.uid())
    )
  );

create policy "Authors can insert versions" on public.prompt_versions
  for insert with check (auth.uid() is not null);

-- ================================================================
-- COMMENTS
-- ================================================================
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  prompt_id uuid references public.prompts(id) on delete cascade not null,
  author_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  parent_id uuid references public.comments(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.comments enable row level security;

create policy "Comments on visible prompts are viewable" on public.comments
  for select using (true);

create policy "Authenticated users can comment" on public.comments
  for insert with check (auth.uid() is not null and author_id = auth.uid());

create policy "Authors can update their comments" on public.comments
  for update using (author_id = auth.uid());

create policy "Authors can delete their comments" on public.comments
  for delete using (
    author_id = auth.uid()
    or exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

-- ================================================================
-- SUGGESTIONS (improvement proposals)
-- ================================================================
create table public.suggestions (
  id uuid primary key default gen_random_uuid(),
  prompt_id uuid references public.prompts(id) on delete cascade not null,
  author_id uuid references public.profiles(id) on delete cascade not null,
  suggested_content text not null,
  explanation text,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz default now()
);

alter table public.suggestions enable row level security;

create policy "Suggestions are viewable by prompt authors and admins" on public.suggestions
  for select using (
    author_id = auth.uid()
    or exists (
      select 1 from public.prompts p where p.id = prompt_id and p.author_id = auth.uid()
    )
    or exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

create policy "Authenticated users can suggest" on public.suggestions
  for insert with check (auth.uid() is not null and author_id = auth.uid());

-- ================================================================
-- LIKES
-- ================================================================
create table public.likes (
  user_id uuid references public.profiles(id) on delete cascade,
  prompt_id uuid references public.prompts(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, prompt_id)
);

alter table public.likes enable row level security;

create policy "Likes are viewable by everyone" on public.likes
  for select using (true);

create policy "Users can manage their own likes" on public.likes
  for all using (auth.uid() = user_id);

-- Trigger to update like_count on prompts
create or replace function public.update_like_count()
returns trigger language plpgsql security definer
as $$
begin
  if tg_op = 'INSERT' then
    update public.prompts set like_count = like_count + 1 where id = new.prompt_id;
  elsif tg_op = 'DELETE' then
    update public.prompts set like_count = like_count - 1 where id = old.prompt_id;
  end if;
  return null;
end;
$$;

create trigger on_like_change
  after insert or delete on public.likes
  for each row execute procedure public.update_like_count();

-- ================================================================
-- SEED: Initial Categories
-- ================================================================
insert into public.categories (name, slug, description, icon, color, ai_model) values
  ('Writing & Copywriting', 'writing', 'Prompts for writing, editing, and copywriting', '✍️', '#8b5cf6', null),
  ('Coding & Development', 'coding', 'Programming, debugging, and code review prompts', '💻', '#3b82f6', null),
  ('Analysis & Research', 'analysis', 'Data analysis, research, and summarization', '🔬', '#10b981', null),
  ('Creative & Storytelling', 'creative', 'Creative writing, stories, and world-building', '🎨', '#f59e0b', null),
  ('Business & Productivity', 'business', 'Business tasks, emails, and productivity', '📊', '#ef4444', null),
  ('Education & Learning', 'education', 'Teaching, explaining concepts, and tutoring', '🎓', '#06b6d4', null),
  ('Role-Playing & Characters', 'roleplay', 'Character creation, personas, and role-play', '🎭', '#ec4899', null),
  ('Translation & Language', 'language', 'Language learning, translation, and linguistics', '🌍', '#84cc16', null),
  ('System Prompts', 'system', 'System-level instructions and AI configuration', '⚙️', '#6b7280', null),
  ('Claude Specific', 'claude', 'Prompts optimized specifically for Claude', '🤖', '#ff6b35', 'claude'),
  ('ChatGPT Specific', 'chatgpt', 'Prompts optimized for ChatGPT/GPT-4', '💬', '#19c37d', 'chatgpt'),
  ('Gemini Specific', 'gemini', 'Prompts optimized for Google Gemini', '✨', '#4285f4', 'gemini');
