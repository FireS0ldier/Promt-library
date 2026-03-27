'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Github, Search, Loader2, FileText, ArrowRight, CheckCircle2, XCircle, ChevronDown, ChevronUp, AlertTriangle, ExternalLink } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

interface ImportedFile {
  name: string;
  path: string;
  content: string;
  url: string;
}

interface SelectedFile extends ImportedFile {
  title: string;
  type: 'skill' | 'prompt';
  selected: boolean;
  expanded: boolean;
}

interface ExistingImport {
  id: string;
  title: string;
  status: string;
  created_at: string;
}

export function GitHubImportClient() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<SelectedFile[]>([]);
  const [done, setDone] = useState(false);
  const [existingImports, setExistingImports] = useState<ExistingImport[]>([]);

  const checkExisting = async (repoUrl: string) => {
    const supabase = createClient();
    // Normalize URL: strip trailing slash and .git
    const normalized = repoUrl.trim().replace(/\.git$/, '').replace(/\/$/, '');
    const { data } = await supabase
      .from('prompts')
      .select('id, title, status, created_at')
      .ilike('github_url', `${normalized}%`)
      .order('created_at', { ascending: false });
    return (data || []) as ExistingImport[];
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    setFiles([]);
    setDone(false);
    setExistingImports([]);

    try {
      // Check for existing imports in parallel with the GitHub scan
      const [existing, res] = await Promise.all([
        checkExisting(url),
        fetch('/api/github/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: url.trim() }),
        }),
      ]);

      setExistingImports(existing);

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Import failed');
        return;
      }

      const mapped: SelectedFile[] = (data.files as ImportedFile[]).map((f) => ({
        ...f,
        title: f.name.replace(/\.(md|txt|prompt)$/, '').replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        type: guessType(f.name, f.content),
        selected: true,
        expanded: false,
      }));

      setFiles(mapped);
      if (mapped.length === 0) {
        toast.error('No .md, .txt, or .prompt files found');
      } else {
        toast.success(`Found ${mapped.length} file${mapped.length > 1 ? 's' : ''}`);
        setDone(true);
      }
    } catch {
      toast.error('Network error — please try again');
    } finally {
      setLoading(false);
    }
  };

  const guessType = (name: string, content: string): 'skill' | 'prompt' => {
    const lower = (name + content).toLowerCase();
    if (lower.includes('skill') || lower.includes('system prompt') || lower.includes('agent') || lower.includes('claude')) {
      return 'skill';
    }
    return 'prompt';
  };

  const toggle = (i: number, field: 'selected' | 'expanded') => {
    setFiles((prev) => prev.map((f, idx) => idx === i ? { ...f, [field]: !f[field] } : f));
  };

  const updateField = (i: number, field: 'title' | 'type', value: string) => {
    setFiles((prev) => prev.map((f, idx) => idx === i ? { ...f, [field]: value } : f));
  };

  const submitSelected = () => {
    const selected = files.filter((f) => f.selected);
    if (selected.length === 0) {
      toast.error('Select at least one file');
      return;
    }
    // Submit first selected file — pre-fill the new prompt form
    const first = selected[0];
    const params = new URLSearchParams({
      content: first.content,
      type: first.type,
      title: first.title,
      github_url: url.trim(),
    });
    router.push(`/prompts/new?${params.toString()}`);
  };

  const submitOne = (file: SelectedFile) => {
    const params = new URLSearchParams({
      content: file.content,
      type: file.type,
      title: file.title,
      github_url: url.trim(),
    });
    router.push(`/prompts/new?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      {/* URL Input */}
      <form onSubmit={handleImport} className="bg-card border rounded-2xl p-6 shadow-sm">
        <label className="block text-sm font-medium mb-2">GitHub Repository URL</label>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Github className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://github.com/owner/repo"
              required
              className="w-full pl-10 pr-4 py-3 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            {loading ? 'Scanning...' : 'Scan Repo'}
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Scans for <code className="bg-muted px-1 rounded">.md</code>, <code className="bg-muted px-1 rounded">.txt</code>, and <code className="bg-muted px-1 rounded">.prompt</code> files in the repository root.
        </p>
      </form>

      {/* Already imported warning */}
      {existingImports.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-yellow-800 dark:text-yellow-300 text-sm">
                This repo was already imported {existingImports.length} time{existingImports.length > 1 ? 's' : ''}
              </p>
              <ul className="mt-2 space-y-1">
                {existingImports.map((imp) => (
                  <li key={imp.id} className="flex items-center gap-2 text-xs text-yellow-700 dark:text-yellow-400">
                    <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                      imp.status === 'official' ? 'bg-yellow-200 text-yellow-800' :
                      imp.status === 'approved' ? 'bg-green-100 text-green-700' :
                      imp.status === 'pending' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {imp.status}
                    </span>
                    <span>{imp.title}</span>
                    <a
                      href={`/prompts/${imp.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-auto hover:underline flex items-center gap-1"
                    >
                      View <ExternalLink className="w-3 h-3" />
                    </a>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-2">
                You can still submit again if this is a new version or different skill.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {files.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-lg">
              Found {files.length} file{files.length > 1 ? 's' : ''}
            </h2>
            <span className="text-sm text-muted-foreground">
              {files.filter((f) => f.selected).length} selected
            </span>
          </div>

          {files.map((file, i) => (
            <div
              key={file.path}
              className={`bg-card border rounded-2xl overflow-hidden shadow-sm transition-all ${
                file.selected ? 'border-primary/40' : 'opacity-60'
              }`}
            >
              {/* File Header */}
              <div className="p-4 flex items-start gap-3">
                <button
                  onClick={() => toggle(i, 'selected')}
                  className="mt-0.5 shrink-0"
                >
                  {file.selected
                    ? <CheckCircle2 className="w-5 h-5 text-primary" />
                    : <XCircle className="w-5 h-5 text-muted-foreground" />
                  }
                </button>

                <div className="flex-1 min-w-0">
                  {/* Editable title */}
                  <input
                    type="text"
                    value={file.title}
                    onChange={(e) => updateField(i, 'title', e.target.value)}
                    className="w-full font-semibold bg-transparent border-b border-transparent hover:border-border focus:border-primary focus:outline-none text-sm pb-0.5"
                  />
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      {file.name}
                    </span>
                    {/* Type selector */}
                    <select
                      value={file.type}
                      onChange={(e) => updateField(i, 'type', e.target.value as 'skill' | 'prompt')}
                      className="text-xs border rounded-md px-2 py-0.5 bg-background"
                    >
                      <option value="skill">Claude Skill</option>
                      <option value="prompt">General Prompt</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => submitOne(file)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500 text-white text-xs font-medium hover:bg-orange-600 transition-colors"
                  >
                    Submit
                    <ArrowRight className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => toggle(i, 'expanded')}
                    className="p-1.5 rounded-lg hover:bg-accent transition-colors"
                  >
                    {file.expanded
                      ? <ChevronUp className="w-4 h-4" />
                      : <ChevronDown className="w-4 h-4" />
                    }
                  </button>
                </div>
              </div>

              {/* Expandable content preview */}
              {file.expanded && (
                <div className="border-t bg-muted/30 p-4">
                  <pre className="text-xs font-mono whitespace-pre-wrap break-words max-h-64 overflow-y-auto text-muted-foreground">
                    {file.content}
                  </pre>
                </div>
              )}
            </div>
          ))}

          {files.filter((f) => f.selected).length > 1 && (
            <p className="text-sm text-muted-foreground text-center">
              Multiple files selected — click <strong>Submit</strong> on each file individually to submit them one by one.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
