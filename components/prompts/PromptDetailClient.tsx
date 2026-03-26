'use client';

import { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { Prompt, PromptVersion, Comment, Suggestion } from '@/types';
import { createClient } from '@/lib/supabase/client';
import { formatRelativeTime } from '@/lib/utils';
import {
  Copy, Check, Heart, MessageSquare, Lightbulb, History,
  Send, ChevronDown, ChevronUp, Globe, ExternalLink, Pencil
} from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface Props {
  prompt: Prompt & { is_liked: boolean };
  user: User | null;
  isAuthor: boolean;
  versions: PromptVersion[];
  comments: Comment[];
  suggestions: Suggestion[];
}

export function PromptDetailClient({ prompt, user, isAuthor, versions, comments, suggestions }: Props) {
  const [activeTab, setActiveTab] = useState<'prompt' | 'versions' | 'comments' | 'suggestions'>('prompt');
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState(prompt.is_liked);
  const [likeCount, setLikeCount] = useState(prompt.like_count);
  const [commentText, setCommentText] = useState('');
  const [localComments, setLocalComments] = useState<Comment[]>(comments);
  const [suggestionText, setSuggestionText] = useState('');
  const [suggestionExplanation, setSuggestionExplanation] = useState('');
  const supabase = createClient();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(prompt.content);
    setCopied(true);
    toast.success('Prompt copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLike = async () => {
    if (!user) {
      toast.error('Please sign in to like prompts');
      return;
    }
    if (liked) {
      await supabase.from('likes').delete().eq('prompt_id', prompt.id).eq('user_id', user.id);
      setLiked(false);
      setLikeCount(c => c - 1);
    } else {
      await supabase.from('likes').insert({ prompt_id: prompt.id, user_id: user.id });
      setLiked(true);
      setLikeCount(c => c + 1);
    }
  };

  const handleComment = async () => {
    if (!user) { toast.error('Please sign in to comment'); return; }
    if (!commentText.trim()) return;

    const { data, error } = await supabase
      .from('comments')
      .insert({ prompt_id: prompt.id, author_id: user.id, content: commentText.trim() })
      .select('*, author:profiles(*)')
      .single();

    if (error) { toast.error('Failed to post comment'); return; }

    setLocalComments(prev => [...prev, data]);
    setCommentText('');
    toast.success('Comment posted!');
  };

  const handleSuggestion = async () => {
    if (!user) { toast.error('Please sign in to suggest improvements'); return; }
    if (!suggestionText.trim()) return;

    const { error } = await supabase.from('suggestions').insert({
      prompt_id: prompt.id,
      author_id: user.id,
      suggested_content: suggestionText.trim(),
      explanation: suggestionExplanation.trim() || null,
    });

    if (error) { toast.error('Failed to submit suggestion'); return; }

    setSuggestionText('');
    setSuggestionExplanation('');
    toast.success('Suggestion submitted! The author will review it.');
  };

  const handleTranslate = () => {
    const url = `https://translate.google.com/?sl=auto&tl=en&text=${encodeURIComponent(prompt.content)}&op=translate`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const tabs = [
    { id: 'prompt', label: 'Prompt', count: null },
    { id: 'versions', label: 'Versions', count: versions.length },
    { id: 'comments', label: 'Comments', count: localComments.length },
    { id: 'suggestions', label: 'Suggestions', count: suggestions.length },
  ] as const;

  return (
    <div className="space-y-4">
      {/* Action Bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={handleLike}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
            liked
              ? 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-900/20 dark:border-rose-800'
              : 'hover:bg-accent'
          }`}
        >
          <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
          {likeCount}
        </button>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border hover:bg-accent transition-colors"
        >
          {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copied!' : 'Copy Prompt'}
        </button>

        <button
          onClick={handleTranslate}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border hover:bg-accent transition-colors"
        >
          <Globe className="w-4 h-4" />
          Translate
        </button>

        {isAuthor && (
          <Link
            href={`/prompts/${prompt.id}/edit`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border hover:bg-accent transition-colors ml-auto"
          >
            <Pencil className="w-4 h-4" />
            Edit
          </Link>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex gap-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 -mb-px ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
              {tab.count !== null && tab.count > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-xs bg-muted text-muted-foreground">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'prompt' && (
        <div className="rounded-xl border bg-muted/30">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Prompt Content</span>
            <button onClick={handleCopy} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <pre className="prompt-content p-5 overflow-x-auto text-sm leading-relaxed">
            {prompt.content}
          </pre>
        </div>
      )}

      {activeTab === 'versions' && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Version history tracks all changes to this prompt.</p>
          {versions.length > 0 ? (
            versions.map((v: PromptVersion) => (
              <div key={v.id} className="rounded-xl border bg-card p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium text-sm">Version {v.version_number}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{formatRelativeTime(v.created_at)}</span>
                </div>
                {v.change_notes && (
                  <p className="text-sm text-muted-foreground mb-3">{v.change_notes}</p>
                )}
                <pre className="text-xs font-mono bg-muted/50 rounded-lg p-3 overflow-x-auto line-clamp-4">
                  {v.content}
                </pre>
                {v.author && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    by {v.author.full_name || v.author.username || 'Anonymous'}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm">No versions yet</div>
          )}

          {isAuthor && (
            <div className="rounded-xl border bg-card p-4">
              <h4 className="font-medium text-sm mb-3">Post New Version</h4>
              <PostVersionForm promptId={prompt.id} currentVersion={prompt.version || 1} userId={user?.id} />
            </div>
          )}
        </div>
      )}

      {activeTab === 'comments' && (
        <div className="space-y-4">
          {localComments.map((comment: Comment) => (
            <div key={comment.id} className="flex gap-3">
              {comment.author?.avatar_url ? (
                <img src={comment.author.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {(comment.author?.full_name || 'U')[0].toUpperCase()}
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="font-medium text-sm">{comment.author?.full_name || comment.author?.username || 'Anonymous'}</span>
                  <span className="text-xs text-muted-foreground">{formatRelativeTime(comment.created_at)}</span>
                </div>
                <p className="text-sm text-foreground/90 mt-0.5">{comment.content}</p>
              </div>
            </div>
          ))}

          {user ? (
            <div className="flex gap-3 pt-2 border-t">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {(user.email || 'U')[0].toUpperCase()}
              </div>
              <div className="flex-1">
                <textarea
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  placeholder="Add a comment..."
                  className="w-full px-3 py-2 rounded-lg border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                  rows={2}
                />
                <button
                  onClick={handleComment}
                  disabled={!commentText.trim()}
                  className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-3.5 h-3.5" />
                  Post Comment
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-sm text-muted-foreground border-t pt-4">
              <Link href="/login" className="text-primary hover:underline">Sign in</Link> to comment
            </div>
          )}
        </div>
      )}

      {activeTab === 'suggestions' && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Suggest improvements to this prompt. The author can accept or reject your suggestions.
          </p>

          {suggestions && suggestions.length > 0 ? (
            suggestions.map((s: Suggestion) => (
              <div key={s.id} className="rounded-xl border bg-card p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">
                    {s.author?.full_name || s.author?.username || 'Anonymous'}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    s.status === 'accepted' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                    s.status === 'rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                  }`}>
                    {s.status}
                  </span>
                </div>
                {s.explanation && <p className="text-sm text-muted-foreground mb-2">{s.explanation}</p>}
                <pre className="text-xs font-mono bg-muted/50 rounded-lg p-3 overflow-x-auto line-clamp-4">
                  {s.suggested_content}
                </pre>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-sm text-muted-foreground">No suggestions yet — be the first!</div>
          )}

          {user ? (
            <div className="rounded-xl border bg-card p-4 space-y-3">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-yellow-500" />
                Suggest an Improvement
              </h4>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Explanation (optional)</label>
                <input
                  value={suggestionExplanation}
                  onChange={e => setSuggestionExplanation(e.target.value)}
                  placeholder="What would you improve and why?"
                  className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Improved Prompt *</label>
                <textarea
                  value={suggestionText}
                  onChange={e => setSuggestionText(e.target.value)}
                  placeholder="Paste your improved version of the prompt here..."
                  className="w-full px-3 py-2 rounded-lg border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                  rows={6}
                />
              </div>
              <button
                onClick={handleSuggestion}
                disabled={!suggestionText.trim()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-3.5 h-3.5" />
                Submit Suggestion
              </button>
            </div>
          ) : (
            <div className="text-center py-4 text-sm text-muted-foreground border-t pt-4">
              <Link href="/login" className="text-primary hover:underline">Sign in</Link> to suggest improvements
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PostVersionForm({ promptId, currentVersion, userId }: { promptId: string; currentVersion: number; userId?: string }) {
  const [content, setContent] = useState('');
  const [changeNotes, setChangeNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleSubmit = async () => {
    if (!content.trim() || !userId) return;
    setLoading(true);

    const newVersion = currentVersion + 1;
    const { error } = await supabase.from('prompt_versions').insert({
      prompt_id: promptId,
      content: content.trim(),
      version_number: newVersion,
      change_notes: changeNotes.trim() || null,
      author_id: userId,
    });

    if (!error) {
      await supabase.from('prompts').update({ content: content.trim(), version: newVersion }).eq('id', promptId);
      toast.success(`Version ${newVersion} posted!`);
      setContent('');
      setChangeNotes('');
    } else {
      toast.error('Failed to post version');
    }
    setLoading(false);
  };

  return (
    <div className="space-y-3">
      <input
        value={changeNotes}
        onChange={e => setChangeNotes(e.target.value)}
        placeholder="What changed in this version?"
        className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="New prompt content..."
        rows={6}
        className="w-full px-3 py-2 rounded-lg border bg-background text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
      <button
        onClick={handleSubmit}
        disabled={!content.trim() || loading}
        className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
      >
        {loading ? 'Posting...' : 'Post New Version'}
      </button>
    </div>
  );
}
