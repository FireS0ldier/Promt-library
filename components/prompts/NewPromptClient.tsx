'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Category, AIModel, VerificationReport } from '@/types';
import { createClient } from '@/lib/supabase/client';
import { AI_MODEL_LABELS } from '@/lib/utils';
import { VerificationBadge } from './VerificationBadge';
import {
  Github, Upload, Sparkles, AlertTriangle, CheckCircle, Loader2, Info, X
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  categories: Category[];
  userId: string;
  defaultImport: boolean;
}

export function NewPromptClient({ categories, userId, defaultImport }: Props) {
  const [tab, setTab] = useState<'manual' | 'github'>(defaultImport ? 'github' : 'manual');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
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
        toast.success(`Found ${data.files.length} files. Select one below.`);
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
      // Run verification if not done yet
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
          status,
          language,
          verification_score: report?.overall_score || 0,
          verification_results: report?.results || null,
          tags: tagArray,
          github_url: tab === 'github' ? githubUrl : null,
        })
        .select()
        .single();

      if (error) throw error;

      // Also save as version 1
      await supabase.from('prompt_versions').insert({
        prompt_id: data.id,
        content: content.trim(),
        version_number: 1,
        change_notes: 'Initial version',
        author_id: userId,
      });

      toast.success(
        status === 'approved' ? 'Prompt submitted and approved!' :
        status === 'pending' ? 'Prompt submitted! Under manual review.' :
        'Prompt submitted but failed quality checks. Please improve it.'
      );

      router.push(`/prompts/${data.id}`);
    } catch (err) {
      toast.error('Failed to submit prompt');
      console.error(err);
    }
    setSubmitting(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Form */}
      <div className="lg:col-span-2 space-y-6">
        {/* Source Tabs */}
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

        {/* GitHub Import */}
        {tab === 'github' && (
          <div className="rounded-xl border bg-card p-5 space-y-4">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
              <p className="text-sm text-muted-foreground">
                Import prompts stored in your GitHub repo (.md, .txt, .prompt files).
                For private repos, provide a personal access token.
              </p>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium block mb-1.5">GitHub URL *</label>
                <input
                  value={githubUrl}
                  onChange={e => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/username/repo/blob/main/prompts/my-prompt.md"
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

            {/* File selection if multiple */}
            {githubFiles.length > 1 && (
              <div>
                <label className="text-sm font-medium block mb-2">Select a file to import:</label>
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
                      className="w-full text-left px-3 py-2 rounded-lg border hover:bg-accent transition-colors text-sm flex items-center gap-2"
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
            placeholder="Give your prompt a clear, descriptive title"
            className="w-full px-3 py-2.5 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {/* Description */}
        <div>
          <label className="text-sm font-medium block mb-1.5">Description</label>
          <input
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Brief description of what this prompt does"
            className="w-full px-3 py-2.5 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {/* Content */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-medium">Prompt Content *</label>
            <span className="text-xs text-muted-foreground">{content.length} characters</span>
          </div>
          <textarea
            value={content}
            onChange={e => { setContent(e.target.value); setVerificationReport(null); }}
            placeholder="Enter your prompt here..."
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
              {Object.entries(AI_MODEL_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1.5">Category</label>
            <select
              value={categoryId}
              onChange={e => setCategoryId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">Select a category</option>
              {categories.map(cat => (
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
              placeholder="writing, creative, code (comma separated)"
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

        {/* Verification Report */}
        {verificationReport && (
          <VerificationBadge report={verificationReport} />
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={handleVerify}
            disabled={verifying || !content.trim() || !title.trim()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50"
          >
            {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            Run Verification
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !content.trim() || !title.trim()}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {submitting ? 'Submitting...' : 'Submit Prompt'}
          </button>
        </div>
      </div>

      {/* Sidebar: Guidelines */}
      <div className="space-y-5">
        <div className="rounded-xl border bg-card p-5">
          <h3 className="font-semibold text-sm mb-4">Submission Guidelines</h3>
          <ul className="space-y-2.5 text-sm text-muted-foreground">
            {[
              'Use clear, descriptive titles',
              'Provide context about what the prompt does',
              'Test your prompt before submitting',
              'Use specific instructions and examples',
              'Avoid harmful or policy-violating content',
              'Mark the correct AI model',
              'Add relevant tags for discoverability',
            ].map(item => (
              <li key={item} className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800 p-5">
          <div className="flex items-center gap-2 font-semibold text-amber-800 dark:text-amber-300 text-sm mb-3">
            <AlertTriangle className="w-4 h-4" />
            Review Process
          </div>
          <p className="text-sm text-amber-700 dark:text-amber-400">
            All prompts are automatically checked for safety, quality, and originality. High-scoring prompts
            are auto-approved. Others go through manual review by our team.
          </p>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <h3 className="font-semibold text-sm mb-3">Quality Score Thresholds</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-green-600 font-medium">70%+ → Auto Approved</span>
              <CheckCircle className="w-4 h-4 text-green-500" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-yellow-600 font-medium">40–70% → Manual Review</span>
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-red-600 font-medium">&lt;40% → Rejected</span>
              <X className="w-4 h-4 text-red-500" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
