'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Category, AIModel, PromptType, VerificationReport } from '@/types';
import { createClient } from '@/lib/supabase/client';
import { AI_MODEL_LABELS } from '@/lib/utils';
import { VerificationBadge } from './VerificationBadge';
import { CheckCircle, Loader2, AlertTriangle, X, Save, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface Props {
  prompt: any;
  categories: Category[];
  userId: string;
}

const SKILL_MODELS: AIModel[] = ['claude', 'openclaw'];
const GENERAL_MODELS: AIModel[] = ['claude', 'chatgpt', 'gemini', 'grok', 'openclaw', 'other'];

export function EditPromptClient({ prompt, categories, userId }: Props) {
  const [title, setTitle]           = useState(prompt.title);
  const [content, setContent]       = useState(prompt.content);
  const [description, setDescription] = useState(prompt.description || '');
  const [aiModel, setAiModel]       = useState<AIModel>(prompt.ai_model);
  const [categoryId, setCategoryId] = useState(prompt.category_id || '');
  const [tags, setTags]             = useState((prompt.tags || []).join(', '));
  const [language, setLanguage]     = useState(prompt.language || 'en');
  const [changeNotes, setChangeNotes] = useState('');

  const [verificationReport, setVerificationReport] = useState<VerificationReport | null>(null);
  const [verifying, setVerifying]   = useState(false);
  const [saving, setSaving]         = useState(false);

  const router = useRouter();
  const supabase = createClient();

  const type: PromptType  = prompt.type || 'prompt';
  const availableModels   = type === 'skill' ? SKILL_MODELS : GENERAL_MODELS;
  const filteredCategories = categories.filter(cat => {
    if (type === 'skill') return cat.ai_model === 'claude' || cat.ai_model === 'openclaw';
    return !cat.ai_model || !['claude', 'openclaw'].includes(cat.ai_model ?? '');
  });

  const contentChanged = content.trim() !== prompt.content.trim();

  const handleVerify = async () => {
    if (!content.trim() || !title.trim()) { toast.error('Title and content required'); return; }
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

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) { toast.error('Title and content are required'); return; }
    setSaving(true);
    try {
      // Re-verify if content changed
      let report = verificationReport;
      if (contentChanged && !report) {
        const res = await fetch('/api/prompts/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content, title }),
        });
        const data = await res.json();
        report = data.report;
        setVerificationReport(data.report);
      }

      const tagArray = tags.split(',').map((t: string) => t.trim().toLowerCase()).filter(Boolean);
      const score    = report?.overall_score ?? prompt.verification_score;
      const newVersion = (prompt.version || 1) + (contentChanged ? 1 : 0);
      const newStatus  = contentChanged
        ? (score >= 70 ? 'approved' : score >= 40 ? 'pending' : 'rejected')
        : prompt.status;

      const { error: updateError } = await supabase
        .from('prompts')
        .update({
          title:                title.trim(),
          content:              content.trim(),
          description:          description.trim() || null,
          ai_model:             aiModel,
          category_id:          categoryId || null,
          language,
          tags:                 tagArray,
          version:              newVersion,
          status:               newStatus,
          verification_score:   score,
          verification_results: report?.results ?? prompt.verification_results,
          updated_at:           new Date().toISOString(),
        })
        .eq('id', prompt.id);

      if (updateError) throw updateError;

      // Save new version entry only if content changed
      if (contentChanged) {
        await supabase.from('prompt_versions').insert({
          prompt_id:      prompt.id,
          content:        content.trim(),
          version_number: newVersion,
          change_notes:   changeNotes.trim() || null,
          author_id:      userId,
        });
      }

      toast.success('Saved successfully!');
      router.push(`/prompts/${prompt.id}`);
      router.refresh();
    } catch (err) {
      toast.error('Failed to save');
      console.error(err);
    }
    setSaving(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* ── Form ── */}
      <div className="lg:col-span-2 space-y-6">

        {/* Back link */}
        <Link
          href={`/prompts/${prompt.id}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to {type === 'skill' ? 'Skill' : 'Prompt'}
        </Link>

        {/* Title */}
        <div>
          <label className="text-sm font-medium block mb-1.5">Title *</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {/* Description */}
        <div>
          <label className="text-sm font-medium block mb-1.5">Short Description</label>
          <input
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {/* Content */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-medium">Content *</label>
            <div className="flex items-center gap-2">
              {contentChanged && (
                <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                  Modified — new version will be saved
                </span>
              )}
              <span className="text-xs text-muted-foreground">{content.length} chars</span>
            </div>
          </div>
          <textarea
            value={content}
            onChange={e => { setContent(e.target.value); setVerificationReport(null); }}
            rows={14}
            className="w-full px-3 py-2.5 rounded-lg border bg-background font-mono text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {/* Change notes (only shown when content differs) */}
        {contentChanged && (
          <div>
            <label className="text-sm font-medium block mb-1.5">Change Notes</label>
            <input
              value={changeNotes}
              onChange={e => setChangeNotes(e.target.value)}
              placeholder="Briefly describe what you changed..."
              className="w-full px-3 py-2.5 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        )}

        {/* Model + Category */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium block mb-1.5">AI Model</label>
            <select
              value={aiModel}
              onChange={e => setAiModel(e.target.value as AIModel)}
              className="w-full px-3 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {availableModels.map(m => (
                <option key={m} value={m}>{AI_MODEL_LABELS[m]}</option>
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
              <option value="">No category</option>
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
              placeholder="tag1, tag2, tag3"
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
          {contentChanged && (
            <button
              onClick={handleVerify}
              disabled={verifying}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50"
            >
              {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Re-verify
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-white text-sm font-medium transition-opacity disabled:opacity-50 ${
              type === 'skill'
                ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:opacity-90'
                : 'bg-primary hover:bg-primary/90'
            }`}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* ── Sidebar info ── */}
      <div className="space-y-5">
        <div className="rounded-xl border bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800 p-5">
          <div className="flex items-center gap-2 font-semibold text-amber-800 dark:text-amber-300 text-sm mb-3">
            <AlertTriangle className="w-4 h-4" />
            Edit Rules
          </div>
          <ul className="space-y-2 text-sm text-amber-700 dark:text-amber-400">
            <li>• Changing the content creates a new version automatically</li>
            <li>• Content changes trigger re-verification</li>
            <li>• Status may change based on the new score</li>
            <li>• All previous versions remain in history</li>
          </ul>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <h3 className="font-semibold text-sm mb-3">Current Status</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Version</span>
              <span className="font-medium">v{prompt.version || 1}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Score</span>
              <span className={`font-medium ${
                prompt.verification_score >= 70 ? 'text-green-600' :
                prompt.verification_score >= 40 ? 'text-yellow-600' : 'text-red-600'
              }`}>{prompt.verification_score}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <span className="font-medium capitalize">{prompt.status}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
