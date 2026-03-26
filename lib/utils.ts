import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '—';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(d);
}

export function formatRelativeTime(date: string | Date | null | undefined): string {
  if (!date) return '—';
  const now = new Date();
  const d = new Date(date);
  if (isNaN(d.getTime())) return '—';
  const diff = now.getTime() - d.getTime();

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  if (weeks < 4) return `${weeks}w ago`;
  if (months < 12) return `${months}mo ago`;
  return formatDate(date);
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + '...';
}

export const AI_MODEL_LABELS: Record<string, string> = {
  claude: 'Claude',
  chatgpt: 'ChatGPT',
  gemini: 'Gemini',
  grok: 'Grok',
  openclaw: 'OpenClaw',
  other: 'Other',
};

export const AI_MODEL_COLORS: Record<string, string> = {
  claude: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  chatgpt: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  gemini: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  grok: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  openclaw: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  other: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300',
};

export const STATUS_LABELS: Record<string, string> = {
  pending: 'Under Review',
  approved: 'Approved',
  rejected: 'Rejected',
  official: 'Official',
};

export const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  official: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
};

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function detectLanguage(text: string): string {
  // Simple heuristic - in production use a proper language detection library
  const latinChars = (text.match(/[a-zA-Z]/g) || []).length;
  const totalChars = text.replace(/\s/g, '').length;
  if (totalChars === 0) return 'en';
  if (latinChars / totalChars < 0.3) return 'unknown';
  return 'en';
}
