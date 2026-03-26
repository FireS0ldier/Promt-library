-- Migration: Add type field to differentiate Skills vs Prompts
-- Skills = structured Claude/OpenClaw specific instructions
-- Prompts = general prompts usable across any AI model

alter table public.prompts
  add column if not exists type text not null default 'prompt'
    check (type in ('skill', 'prompt'));

-- Index for fast filtering by type
create index if not exists prompts_type_idx on public.prompts(type);

-- Add skill-focused categories
insert into public.categories (name, slug, description, icon, color, ai_model) values
  ('Claude System Prompts', 'claude-system', 'System-level instructions that define Claude behavior and persona', '🧠', '#ff6b35', 'claude'),
  ('Claude Agent Skills', 'claude-agents', 'Agentic Claude skills: tool use, planning, multi-step tasks', '🤖', '#ff4500', 'claude'),
  ('Claude Reasoning', 'claude-reasoning', 'Extended thinking, analysis chains, and reasoning frameworks', '💡', '#ff8c42', 'claude'),
  ('Claude Personas', 'claude-personas', 'Character and persona definitions optimized for Claude', '🎭', '#e85d04', 'claude'),
  ('Claude Code Skills', 'claude-code', 'Claude-specific coding assistants and development workflows', '💻', '#dc2f02', 'claude'),
  ('OpenClaw Skills', 'openclaw-skills', 'Skills and system prompts for OpenClaw', '🦾', '#9b2226', 'openclaw')
on conflict (slug) do nothing;
