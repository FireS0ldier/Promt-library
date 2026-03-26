'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Category, AIModel, PromptType, VerificationReport } from '@/types';
import { createClient } from '@/lib/supabase/client';
import { AI_MODEL_LABELS } from '@/lib/utils';
import { VerificationBadge } from './VerificationBadge';
import {
  Github, Upload, Sparkles, AlertTriangle, CheckCircle,
  Loader2, Info, X, Cpu, BookOpen
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  categories: Category[];
  userId: string;
  defaultImport: boolean;
  defaultType?: PromptType;
  defaultContent?: string;
}

const SKILL_MODELS: AIModel[] = ['claude', 'openclaw'];
const GENERAL_MODELS: AIModel[] = ['claude', 'chatgpt', 'gemini', 'grok', 'openclaw', 'other'];

export function NewPromptClient({ categories, userId, defaultImport, defaultType, defaultContent }: Props) {
  const [type, setType] = useState<PromptType>(defaultType || 'skill');
  const [tab, setTab] = useState<'manual' | 'github'>(defaultImport ? 'github' : 'manual');

  const [title, setTitle] = useState('');
  const [content, setContent] = useState(defaultContent || '');
  const [description, setDescription] = useState('');
  const [aiModel, setAiModel] = useState<AIModel>('claude');
  const [categoryId, setCategoryId] = useState('');
  const [tags, setTags] = useState('');
  const [language, setLanguage] = useState('en');

  const [githubUrl, setGithubUrl] = useState('');
  const [githubToken, setGithubToken] = useState('');
  const [loadingGithub, setLoadingGithub] = useState(false);
  const [githubFiles, setGithubFiles] = useState<Array<{ name: string; content: string; path: string }>>([]);

  const [verificationReport, setVerificationReport] = useState<VerificationReport | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  // Filter categories by type
  const filteredCategories = categories.filter(cat => {
    if (type === 'skill') return cat.ai_model === 'claude' || cat.ai_model === 'openclaw';
    return !cat.ai_model || !['claude', 'openclaw'].includes(cat.ai_model);
  });

  const availableModels = type === 'skill' ? SKILL_MODELS : GENERAL_MODELS;

  // Keep model in sync when type changes
  const handleTypeChange = (newType: PromptType) => {
    setType(newType);
    setVerificationReport(null);
    setCategoryId('');
    if (newType === 'skill' && !SKILL_MODELS.includes(aiModel)) {
      setAiModel('claude');
    }
  };

  const handleVerify = async () => {
    if (!content.trim() || !title.trim()) {
      toast.error('Please add a title and content first');
      return;
    }
    setVerifying(true);
    try {
      const res = await fetch('/api/prompts/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, title }),
      });
      const data = await res.json();
      setVerificationReport(data.report);
    } catch {
      toast.error('Verification failed');
    }
    setVerifying(false);
  };

  const handleGithubImport = async () => {
    if (!githubUrl.trim()) { toast.error('Please enter a GitHub URL'); return; }
    setLoadingGithub(true);
    try {
      const res = await fetch('/api/github/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: githubUrl, token: githubToken }),
      });
      const data = await res.json();
      if (data.error) { toast.error(data.error); return; }
      setGithubFiles(data.files);
      if (data.files.length === 1) {
        setContent(data.files[0].content);
        setTitle(data.files[0].name.replace(/\.(md|txt|prompt)$/, ''));
        toast.success('File imported!');
      } else {
        toast.success(`Found ${data.files.length} files — select one below.`);
      }
    } catch {
      toast.error('Failed to import from GitHub');
    }
    setLoadingGithub(false);
  };

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error('Title and content are required');
      return;
    }
    setSubmitting(true);
    try {
      let report = verificationReport;
      if (!report) {
        const res = await fetch('/api/prompts/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content, title }),
        });
        const data = await res.json();
        report = data.report;
        setVerificationReport(data.report);
      }

      const tagArray = tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
      const score = report?.overall_score ?? 0;
      const status = score >= 70 ? 'approved' : score >= 40 ? 'pending' : 'rejected';

      const { data, error } = await supabase
        .from('prompts')
        .insert({
          title: title.trim(),
          content: content.trim(),
          description: description.trim() || null,
          author_id: userId,
          category_id: categoryId || null,
          ai_model: aiModel,
          type,
          status,
          language,
          verification_score: score,
          verification_results: report?.results || null,
          tags: tagArray,
          github_url: tab === 'github' ? githubUrl : null,
        })
        .select()
        .single();

      if (error) throw error;

      await supabase.from('prompt_versions').insert({
        prompt_id: data.id,
        content: content.trim(),
        version_number: 1,
        change_notes: 'Initial version',
        author_id: userId,
      });

      const label = type === 'skill' ? 'Skill' : 'Prompt';
      toast.success(
        status === 'approved' ? `${label} submitted and approved!` :
        status === 'pending'  ? `${label} submitted — under review.` :
                                `${label} submitted but quality score is low. Please improve it.`
      );
      router.push(`/prompts/${data.id}`);
    } catch (err) {
      toast.error('Failed to submit');
      console.error(err);
    }
    setSubmitting(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* ── Form ── */}
      <div className="lg:col-span-2 space-y-6">

        {/* Step 1 — Choose type (most prominent) */}
        <div>
          <label className="text-sm font-medium block mb-3">
            What are you submitting?
          </label>
          <div className="grid grid-cols-2 gap-3">
            {/* Skill */}
            <button
              onClick={() => handleTypeChange('skill')}
              className={`relative text-left p-5 rounded-xl border-2 transition-all ${
                type === 'skill'
                  ? 'border-orange-400 bg-orange-50 dark:bg-orange-900/20 ring-1 ring-orange-300 dark:ring-orange-700'
                  : 'border-border hover:border-orange-200 dark:hover:border-orange-800'
              }`}
            >
              {type === 'skill' && (
                <div className="absolute top-3 right-3 w-4 h-4 rounded-full bg-orange-500 flex items-center justify-center">
                  <CheckCircle className="w-3 h-3 text-white" />
                </div>
              )}
              <Cpu className="w-6 h-6 text-orange-500 mb-2" />
              <div className="font-bold text-base">Claude Skill</div>
              <div className="text-xs text-muted-foreground mt-1 leading-relaxed">
                System prompt, agent definition, persona, or reasoning framework — tuned specifically for Claude or OpenClaw.
              </div>
              <div className="mt-3 flex gap-1">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300">Claude</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">OpenClaw</span>
              </div>
            </button>

            {/* General Prompt */}
            <button
              onClick={() => handleTypeChange('prompt')}
              className={`relative text-left p-5 rounded-xl border-2 transition-all ${
                type === 'prompt'
                  ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                  : 'border-border hover:border-primary/30'
              }`}
            >
              {type === 'prompt' && (
                <div className="absolute top-3 right-3 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                  <CheckCircle className="w-3 h-3 text-white" />
                </div>
              )}
              <BookOpen className="w-6 h-6 text-muted-foreground mb-2" />
              <div className="font-bold text-base">General Prompt</div>
              <div className="text-xs text-muted-foreground mt-1 leading-relaxed">
                A prompt that works across multiple AI models — writing, coding, analysis, creative tasks, etc.
              </div>
              <div className="mt-3 flex gap-1 flex-wrap">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-secondary text-secondary-foreground">Any Model</span>
              </div>
            </button>
          </div>
        </div>

        {/* Source tab */}
        <div className="flex rounded-xl border p-1 bg-muted/30 gap-1 w-fit">
          <button
            onClick={() => setTab('manual')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              tab === 'manual' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Write Manually
          </button>
          <button
            onClick={() => setTab('github')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              tab === 'github' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Github className="w-4 h-4" />
            Import from GitHub
          </button>
        </div>

        {/* GitHub import */}
        {tab === 'github' && (
          <div className="rounded-xl border bg-card p-5 space-y-4">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
              <p className="text-sm text-muted-foreground">
                Import skills or prompts stored in your GitHub repository (.md, .txt, .prompt files).
                For private repos, provide a personal access token.
              </p>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium block mb-1.5">GitHub URL *</label>
                <input
                  value={githubUrl}
                  onChange={e => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/username/repo/blob/main/skills/my-skill.md"
                  className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5">Personal Access Token (optional)</label>
                <input
                  type="password"
                  value={githubToken}
                  onChange={e => setGithubToken(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxx (for private repos)"
                  className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <button
                onClick={handleGithubImport}
                disabled={loadingGithub}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-900 text-white dark:bg-white dark:text-gray-900 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loadingGithub ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                Import from GitHub
              </button>
            </div>
            {githubFiles.length > 1 && (
              <div>
                <label className="text-sm font-medium block mb-2">Select a file:</label>
                <div className="space-y-2">
                  {githubFiles.map(file => (
                    <button
                      key={file.path}
                      onClick={() => {
                        setContent(file.content);
                        setTitle(file.name.replace(/\.(md|txt|prompt)$/, ''));
                        setGithubFiles([]);
                        toast.success(`Loaded: ${file.name}`);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg border hover:bg-accent text-sm flex items-center gap-2"
                    >
                      <Github className="w-4 h-4 shrink-0" />
                      <span className="line-clamp-1">{file.path}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Title */}
        <div>
          <label className="text-sm font-medium block mb-1.5">Title *</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder={type === 'skill' ? 'e.g., Senior Software Engineer System Prompt' : 'e.g., Write a Professional Email'}
            className="w-full px-3 py-2.5 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {/* Description */}
        <div>
          <label className="text-sm font-medium block mb-1.5">Short Description</label>
          <input
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder={type === 'skill' ? 'What does this skill configure Claude to do?' : 'What does this prompt help with?'}
            className="w-full px-3 py-2.5 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {/* Content */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-medium">
              {type === 'skill' ? 'Skill Content (System Prompt)' : 'Prompt Content'} *
            </label>
            <span className="text-xs text-muted-foreground">{content.length} chars</span>
          </div>
          <textarea
            value={content}
            onChange={e => { setContent(e.target.value); setVerificationReport(null); }}
            placeholder={
              type === 'skill'
                ? 'You are an expert software engineer with 15 years of experience...\n\nYour role is to...'
                : 'Write a professional email about [topic] that is...'
            }
            rows={12}
            className="w-full px-3 py-2.5 rounded-lg border bg-background font-mono text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {/* AI Model + Category */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium block mb-1.5">AI Model *</label>
            <select
              value={aiModel}
              onChange={e => setAiModel(e.target.value as AIModel)}
              className="w-full px-3 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {availableModels.map(m => (
                <option key={m} value={m}>{AI_MODEL_LABELS[m]}</option>
              ))}
            </select>
            {type === 'skill' && (
              <p className="text-xs text-muted-foreground mt-1">Skills are for Claude & OpenClaw only</p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium block mb-1.5">Category</label>
            <select
              value={categoryId}
              onChange={e => setCategoryId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">Select a category</option>
              {filteredCategories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Tags + Language */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium block mb-1.5">Tags</label>
            <input
              value={tags}
              onChange={e => setTags(e.target.value)}
              placeholder="system-prompt, coding, agent (comma-separated)"
              className="w-full px-3 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1.5">Language</label>
            <select
              value={language}
              onChange={e => setLanguage(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="en">English</option>
              <option value="de">German</option>
              <option value="fr">French</option>
              <option value="es">Spanish</option>
              <option value="zh">Chinese</option>
              <option value="ja">Japanese</option>
              <option value="ko">Korean</option>
              <option value="pt">Portuguese</option>
              <option value="it">Italian</option>
              <option value="ru">Russian</option>
              <option value="ar">Arabic</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        {/* Verification result */}
        {verificationReport && <VerificationBadge report={verificationReport} />}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={handleVerify}
            disabled={verifying || !content.trim() || !title.trim()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50"
          >
            {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            Verify
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !content.trim() || !title.trim()}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-white text-sm font-medium transition-opacity disabled:opacity-50 ${
              type === 'skill'
                ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:opacity-90'
                : 'bg-primary hover:bg-primary/90'
            }`}
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {submitting ? 'Submitting...' : `Submit ${type === 'skill' ? 'Skill' : 'Prompt'}`}
          </button>
        </div>
      </div>

      {/* ── Sidebar ── */}
      <div className="space-y-5">
        {/* Skill vs Prompt guide */}
        {type === 'skill' ? (
          <div className="rounded-xl border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/10 p-5">
            <div className="flex items-center gap-2 font-semibold text-orange-700 dark:text-orange-300 text-sm mb-3">
              <Cpu className="w-4 h-4" />
              Skill Guidelines
            </div>
            <ul className="space-y-2 text-sm text-orange-800 dark:text-orange-300">
              {[
                'Define a clear role or persona for Claude',
                'Include behavioral rules and constraints',
                'Specify tone, style, and output format',
                'Use structured sections (Role, Task, Rules)',
                'Test thoroughly before submitting',
                'Include edge-case handling',
              ].map(item => (
                <li key={item} className="flex items-start gap-2">
                  <CheckCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-orange-500" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="rounded-xl border bg-card p-5">
            <div className="flex items-center gap-2 font-semibold text-sm mb-3">
              <BookOpen className="w-4 h-4" />
              Prompt Guidelines
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {[
                'Use clear, descriptive titles',
                'Include context about the task',
                'Specify expected output format',
                'Add relevant tags for discoverability',
                'Works across multiple AI models',
              ].map(item => (
                <li key={item} className="flex items-start gap-2">
                  <CheckCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-green-500" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Review thresholds */}
        <div className="rounded-xl border bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800 p-5">
          <div className="flex items-center gap-2 font-semibold text-amber-800 dark:text-amber-300 text-sm mb-3">
            <AlertTriangle className="w-4 h-4" />
            Auto-Review Scoring
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-green-700 dark:text-green-400 font-medium">70%+ → Auto Approved</span>
              <CheckCircle className="w-4 h-4 text-green-500" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-yellow-700 dark:text-yellow-400 font-medium">40–70% → Manual Review</span>
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-red-700 dark:text-red-400 font-medium">&lt;40% → Rejected</span>
              <X className="w-4 h-4 text-red-500" />
            </div>
          </div>
          <p className="text-xs text-amber-700 dark:text-amber-400 mt-3">
            3 checks: Safety, Quality, Originality
          </p>
        </div>
      </div>
    </div>
  );
}
