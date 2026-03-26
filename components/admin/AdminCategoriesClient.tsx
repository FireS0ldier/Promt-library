'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Category } from '@/types';
import { Plus, Pencil, Trash2, Check, X, Loader2, Tag } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  initialCategories: (Category & { prompt_count: number })[];
}

const AI_MODELS = [
  { value: '', label: 'All Models (General)' },
  { value: 'claude', label: 'Claude' },
  { value: 'openclaw', label: 'OpenClaw' },
  { value: 'chatgpt', label: 'ChatGPT' },
  { value: 'gemini', label: 'Gemini' },
  { value: 'grok', label: 'Grok' },
];

const EMOJI_SUGGESTIONS = ['✍️','💻','🔬','🎨','📊','🎓','🎭','🌍','⚙️','🤖','💬','✨','🧠','🦾','💡','🔧','📝','🚀','🎯','⚡'];

interface FormState {
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  ai_model: string;
}

const EMPTY_FORM: FormState = { name: '', slug: '', description: '', icon: '📁', color: '#6366f1', ai_model: '' };

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export function AdminCategoriesClient({ initialCategories }: Props) {
  const [categories, setCategories] = useState(initialCategories);
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId]   = useState<string | null>(null);
  const [form, setForm]             = useState<FormState>(EMPTY_FORM);
  const [loading, setLoading]       = useState<string | null>(null);
  const supabase = createClient();

  const setField = (key: keyof FormState, value: string) => {
    setForm(prev => {
      const next = { ...prev, [key]: value };
      if (key === 'name' && !editingId) next.slug = slugify(value);
      return next;
    });
  };

  const startCreate = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowCreate(true);
  };

  const startEdit = (cat: Category) => {
    setForm({
      name:        cat.name,
      slug:        cat.slug,
      description: cat.description || '',
      icon:        cat.icon || '📁',
      color:       cat.color || '#6366f1',
      ai_model:    cat.ai_model || '',
    });
    setEditingId(cat.id);
    setShowCreate(true);
  };

  const cancelForm = () => {
    setShowCreate(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.slug.trim()) {
      toast.error('Name and slug are required');
      return;
    }
    setLoading('save');
    try {
      const payload = {
        name:        form.name.trim(),
        slug:        form.slug.trim(),
        description: form.description.trim() || null,
        icon:        form.icon || null,
        color:       form.color || '#6366f1',
        ai_model:    form.ai_model || null,
      };

      if (editingId) {
        const { data, error } = await supabase
          .from('categories')
          .update(payload)
          .eq('id', editingId)
          .select()
          .single();
        if (error) throw error;
        setCategories(prev => prev.map(c => c.id === editingId ? { ...c, ...data } : c));
        toast.success('Category updated');
      } else {
        const { data, error } = await supabase
          .from('categories')
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        setCategories(prev => [...prev, { ...data, prompt_count: 0 }]);
        toast.success('Category created');
      }
      cancelForm();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save');
    }
    setLoading(null);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete category "${name}"? Prompts in this category will be uncategorised.`)) return;
    setLoading(id);
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete');
    } else {
      setCategories(prev => prev.filter(c => c.id !== id));
      toast.success('Category deleted');
    }
    setLoading(null);
  };

  return (
    <div className="space-y-5">
      {/* Create / Edit form */}
      {showCreate ? (
        <div className="rounded-xl border bg-card p-6 space-y-4">
          <h3 className="font-semibold text-base">{editingId ? 'Edit Category' : 'New Category'}</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium block mb-1.5">Name *</label>
              <input
                value={form.name}
                onChange={e => setField('name', e.target.value)}
                placeholder="e.g. Claude System Prompts"
                className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">Slug *</label>
              <input
                value={form.slug}
                onChange={e => setField('slug', e.target.value)}
                placeholder="claude-system-prompts"
                className="w-full px-3 py-2 rounded-lg border bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium block mb-1.5">Description</label>
            <input
              value={form.description}
              onChange={e => setField('description', e.target.value)}
              placeholder="Short description of this category..."
              className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            {/* Icon */}
            <div>
              <label className="text-sm font-medium block mb-1.5">Icon (emoji)</label>
              <input
                value={form.icon}
                onChange={e => setField('icon', e.target.value)}
                maxLength={4}
                className="w-full px-3 py-2 rounded-lg border bg-background text-xl text-center focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <div className="flex flex-wrap gap-1 mt-2">
                {EMOJI_SUGGESTIONS.map(e => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setField('icon', e)}
                    className={`w-7 h-7 rounded text-base hover:bg-accent transition-colors ${form.icon === e ? 'bg-accent ring-1 ring-primary' : ''}`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
            {/* Color */}
            <div>
              <label className="text-sm font-medium block mb-1.5">Accent Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.color}
                  onChange={e => setField('color', e.target.value)}
                  className="w-10 h-10 rounded-lg border cursor-pointer p-1 bg-background"
                />
                <input
                  value={form.color}
                  onChange={e => setField('color', e.target.value)}
                  placeholder="#6366f1"
                  className="flex-1 px-3 py-2 rounded-lg border bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
            {/* AI Model */}
            <div>
              <label className="text-sm font-medium block mb-1.5">AI Model</label>
              <select
                value={form.ai_model}
                onChange={e => setField('ai_model', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {AI_MODELS.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={loading === 'save'}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {loading === 'save' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {editingId ? 'Save Changes' : 'Create Category'}
            </button>
            <button
              onClick={cancelForm}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border text-sm hover:bg-accent transition-colors"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={startCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed text-sm font-medium hover:bg-accent hover:border-primary/40 transition-all text-muted-foreground hover:text-foreground"
        >
          <Plus className="w-4 h-4" />
          New Category
        </button>
      )}

      {/* Categories table */}
      <div className="rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Category</th>
              <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Slug</th>
              <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Model</th>
              <th className="text-left px-4 py-3 font-medium">Prompts</th>
              <th className="text-right px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {categories.map(cat => (
              <tr key={cat.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0"
                      style={{ backgroundColor: `${cat.color}20`, color: cat.color || undefined }}
                    >
                      {cat.icon}
                    </div>
                    <div>
                      <div className="font-medium">{cat.name}</div>
                      {cat.description && (
                        <div className="text-xs text-muted-foreground line-clamp-1">{cat.description}</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <code className="text-xs bg-muted px-2 py-0.5 rounded">{cat.slug}</code>
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  <span className="text-xs text-muted-foreground capitalize">
                    {cat.ai_model || 'All'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm font-medium">{cat.prompt_count}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => startEdit(cat)}
                      className="p-1.5 rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                      title="Edit"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(cat.id, cat.name)}
                      disabled={loading === cat.id}
                      className="p-1.5 rounded-md hover:bg-destructive/10 hover:text-destructive transition-colors text-muted-foreground disabled:opacity-50"
                      title="Delete"
                    >
                      {loading === cat.id
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <Trash2 className="w-3.5 h-3.5" />
                      }
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {categories.length === 0 && (
          <div className="text-center py-10 text-muted-foreground">
            <Tag className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p>No categories yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
