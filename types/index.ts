export type AIModel = 'claude' | 'chatgpt' | 'gemini' | 'grok' | 'openclaw' | 'other';

export type PromptStatus = 'pending' | 'approved' | 'rejected' | 'official';

export type VerificationStatus = 'pending' | 'running' | 'passed' | 'failed' | 'warning';

export interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  is_admin: boolean;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  ai_model: AIModel | null;
  color: string | null;
  prompt_count?: number;
}

export interface Prompt {
  id: string;
  title: string;
  content: string;
  description: string | null;
  author_id: string;
  category_id: string | null;
  ai_model: AIModel;
  status: PromptStatus;
  language: string;
  verification_score: number;
  verification_results: VerificationResult[] | null;
  tags: string[];
  github_url: string | null;
  view_count: number;
  like_count: number;
  version: number;
  created_at: string;
  updated_at: string;
  // Joined
  author?: Profile;
  category?: Category;
  is_liked?: boolean;
}

export interface PromptVersion {
  id: string;
  prompt_id: string;
  content: string;
  version_number: number;
  change_notes: string | null;
  author_id: string;
  created_at: string;
  author?: Profile;
}

export interface Comment {
  id: string;
  prompt_id: string;
  author_id: string;
  content: string;
  parent_id: string | null;
  created_at: string;
  author?: Profile;
  replies?: Comment[];
}

export interface Suggestion {
  id: string;
  prompt_id: string;
  author_id: string;
  suggested_content: string;
  explanation: string | null;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  author?: Profile;
}

export interface VerificationResult {
  check: string;
  status: VerificationStatus;
  score: number;
  message: string;
  details?: string;
}

export interface VerificationReport {
  overall_score: number;
  overall_status: VerificationStatus;
  results: VerificationResult[];
  checked_at: string;
}

export interface GitHubFile {
  name: string;
  path: string;
  content: string;
  url: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PromptFilters {
  category?: string;
  ai_model?: AIModel;
  status?: PromptStatus;
  search?: string;
  language?: string;
  tags?: string[];
  sort?: 'newest' | 'oldest' | 'most_liked' | 'most_viewed' | 'top_rated';
}
