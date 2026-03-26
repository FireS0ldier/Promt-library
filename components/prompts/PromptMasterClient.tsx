'use client';

import { useState, useMemo } from 'react';
import { AIModel } from '@/types';
import { AI_MODEL_LABELS } from '@/lib/utils';
import { Copy, Check, RefreshCw, Zap, Download, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';

type Framework = 'risen' | 'crispe' | 'coat' | 'rtf' | 'custom';
type FieldRecord = Record<string, string>;

const TONE_OPTIONS = ['Professional', 'Friendly', 'Technical', 'Creative', 'Concise', 'Detailed', 'Formal', 'Casual'];
const FORMAT_OPTIONS = ['Paragraph', 'Bullet Points', 'Numbered List', 'Table', 'JSON', 'Markdown', 'Code', 'Step-by-step'];

export function PromptMasterClient() {
  const [framework, setFramework] = useState<Framework>('risen');
  const [aiModel, setAiModel] = useState<AIModel>('claude');
  const [copied, setCopied] = useState(false);

  // RISEN
  const [risen, setRisen] = useState<FieldRecord>({ role: '', instructions: '', steps: '', endGoal: '', narrowing: '' });
  // CRISPE
  const [crispe, setCrispe] = useState<FieldRecord>({ capacity: '', role: '', insight: '', statement: '', personality: '', experiment: '' });
  // COAT
  const [coat, setCoat] = useState<FieldRecord>({ context: '', objective: '', action: '', tone: '' });
  // RTF
  const [rtf, setRtf] = useState<FieldRecord>({ role: '', task: '', format: '' });
  // Custom
  const [custom, setCustom] = useState<{ sections: Array<{ label: string; content: string }> }>({
    sections: [
      { label: 'Role', content: '' },
      { label: 'Task', content: '' },
      { label: 'Context', content: '' },
    ],
  });

  const generatedPrompt = useMemo(() => {
    switch (framework) {
      case 'risen': {
        const parts: string[] = [];
        if (risen.role) parts.push(`# Role\n${risen.role}`);
        if (risen.instructions) parts.push(`# Instructions\n${risen.instructions}`);
        if (risen.steps) parts.push(`# Steps\n${risen.steps}`);
        if (risen.endGoal) parts.push(`# End Goal\n${risen.endGoal}`);
        if (risen.narrowing) parts.push(`# Constraints\n${risen.narrowing}`);
        return parts.join('\n\n');
      }
      case 'crispe': {
        const parts: string[] = [];
        if (crispe.capacity) parts.push(`Act as ${crispe.capacity}.`);
        if (crispe.role) parts.push(`You are ${crispe.role}.`);
        if (crispe.insight) parts.push(`Context: ${crispe.insight}`);
        if (crispe.statement) parts.push(`Task: ${crispe.statement}`);
        if (crispe.personality) parts.push(`Personality: ${crispe.personality}`);
        if (crispe.experiment) parts.push(`Note: ${crispe.experiment}`);
        return parts.join('\n\n');
      }
      case 'coat': {
        const parts: string[] = [];
        if (coat.context) parts.push(`**Context:** ${coat.context}`);
        if (coat.objective) parts.push(`**Objective:** ${coat.objective}`);
        if (coat.action) parts.push(`**Action:** ${coat.action}`);
        if (coat.tone) parts.push(`**Tone:** ${coat.tone}`);
        return parts.join('\n\n');
      }
      case 'rtf': {
        const parts: string[] = [];
        if (rtf.role) parts.push(`Act as ${rtf.role}.`);
        if (rtf.task) parts.push(rtf.task);
        if (rtf.format) parts.push(`Format your response as: ${rtf.format}`);
        return parts.join('\n\n');
      }
      case 'custom': {
        return custom.sections
          .filter(s => s.content)
          .map(s => `## ${s.label}\n${s.content}`)
          .join('\n\n');
      }
      default: return '';
    }
  }, [framework, risen, crispe, coat, rtf, custom]);

  const isEmpty = !generatedPrompt.trim();

  const handleCopy = async () => {
    if (isEmpty) return;
    await navigator.clipboard.writeText(generatedPrompt);
    setCopied(true);
    toast.success('Prompt copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setRisen({ role: '', instructions: '', steps: '', endGoal: '', narrowing: '' });
    setCrispe({ capacity: '', role: '', insight: '', statement: '', personality: '', experiment: '' });
    setCoat({ context: '', objective: '', action: '', tone: '' });
    setRtf({ role: '', task: '', format: '' });
    toast.success('Cleared!');
  };

  const frameworks: Array<{ id: Framework; label: string; desc: string }> = [
    { id: 'risen', label: 'RISEN', desc: 'Role · Instructions · Steps · End Goal · Narrowing' },
    { id: 'crispe', label: 'CRISPE', desc: 'Capacity · Role · Insight · Statement · Personality · Experiment' },
    { id: 'coat', label: 'COAT', desc: 'Context · Objective · Action · Tone' },
    { id: 'rtf', label: 'RTF', desc: 'Role · Task · Format — Simple & Quick' },
    { id: 'custom', label: 'Custom', desc: 'Build your own structure' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left: Builder */}
      <div className="space-y-6">
        {/* Framework Selector */}
        <div>
          <label className="text-sm font-medium block mb-2">Choose Framework</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {frameworks.map(f => (
              <button
                key={f.id}
                onClick={() => setFramework(f.id)}
                className={`text-left p-3 rounded-xl border transition-all ${
                  framework === f.id
                    ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                    : 'hover:border-primary/30 hover:bg-accent'
                }`}
              >
                <div className="font-bold text-sm">{f.label}</div>
                <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{f.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* AI Model */}
        <div>
          <label className="text-sm font-medium block mb-2">Target AI Model</label>
          <div className="flex flex-wrap gap-2">
            {Object.entries(AI_MODEL_LABELS).map(([val, label]) => (
              <button
                key={val}
                onClick={() => setAiModel(val as AIModel)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  aiModel === val ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-accent'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Framework Fields */}
        {framework === 'risen' && (
          <FrameworkSection fields={[
            { key: 'role', label: 'Role', placeholder: 'e.g., You are an expert software engineer specializing in React...', textarea: true },
            { key: 'instructions', label: 'Instructions', placeholder: 'What should the AI do? Be specific...', textarea: true },
            { key: 'steps', label: 'Steps (optional)', placeholder: 'Break down the task into steps:\n1. First...\n2. Then...', textarea: true },
            { key: 'endGoal', label: 'End Goal', placeholder: 'What is the final desired outcome?', textarea: false },
            { key: 'narrowing', label: 'Constraints', placeholder: 'Limitations, style requirements, what to avoid...', textarea: true },
          ]} values={risen} onChange={(k, v) => setRisen(prev => ({ ...prev, [k]: v }))} />
        )}

        {framework === 'crispe' && (
          <FrameworkSection fields={[
            { key: 'capacity', label: 'Capacity', placeholder: 'e.g., a Senior Data Scientist with 10 years of experience', textarea: false },
            { key: 'role', label: 'Role', placeholder: 'Specific role context...', textarea: false },
            { key: 'insight', label: 'Insight / Context', placeholder: 'Background information the AI needs to know...', textarea: true },
            { key: 'statement', label: 'Statement / Task', placeholder: 'The exact task or question...', textarea: true },
            { key: 'personality', label: 'Personality', placeholder: 'e.g., Direct, use technical language, no fluff', textarea: false },
            { key: 'experiment', label: 'Experiment / Notes', placeholder: 'Additional notes or variations to try...', textarea: false },
          ]} values={crispe} onChange={(k, v) => setCrispe(prev => ({ ...prev, [k]: v }))} />
        )}

        {framework === 'coat' && (
          <FrameworkSection fields={[
            { key: 'context', label: 'Context', placeholder: 'Background information, situation, who you are...', textarea: true },
            { key: 'objective', label: 'Objective', placeholder: 'What do you want to achieve?', textarea: false },
            { key: 'action', label: 'Action', placeholder: 'Specific action or output requested...', textarea: true },
            { key: 'tone', label: 'Tone', placeholder: 'e.g., Professional, Friendly, Technical', textarea: false, options: TONE_OPTIONS },
          ]} values={coat} onChange={(k, v) => setCoat(prev => ({ ...prev, [k]: v }))} />
        )}

        {framework === 'rtf' && (
          <FrameworkSection fields={[
            { key: 'role', label: 'Role', placeholder: 'e.g., a professional copywriter', textarea: false },
            { key: 'task', label: 'Task', placeholder: 'What exactly should be done?', textarea: true },
            { key: 'format', label: 'Format', placeholder: 'e.g., Bullet points, under 200 words', textarea: false, options: FORMAT_OPTIONS },
          ]} values={rtf} onChange={(k, v) => setRtf(prev => ({ ...prev, [k]: v }))} />
        )}

        {framework === 'custom' && (
          <CustomBuilder sections={custom.sections} onChange={sections => setCustom({ sections })} />
        )}
      </div>

      {/* Right: Preview */}
      <div className="space-y-4">
        <div className="sticky top-20">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-500" />
              Generated Prompt
            </h3>
            <div className="flex gap-2">
              <button
                onClick={handleReset}
                className="p-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                title="Clear all"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={handleCopy}
                disabled={isEmpty}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium hover:bg-accent transition-colors disabled:opacity-40"
              >
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          <div className="rounded-xl border bg-muted/30 min-h-[400px] relative">
            {isEmpty ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
                <Zap className="w-10 h-10 mb-3 opacity-20" />
                <p className="font-medium">Your prompt will appear here</p>
                <p className="text-sm mt-1">Fill in the fields on the left to build your prompt</p>
              </div>
            ) : (
              <pre className="p-5 text-sm font-mono whitespace-pre-wrap leading-relaxed overflow-x-auto">
                {generatedPrompt}
              </pre>
            )}
          </div>

          {!isEmpty && (
            <div className="mt-3 flex gap-2">
              <div className="flex-1 px-3 py-2 rounded-lg bg-muted/50 border text-xs text-muted-foreground">
                {generatedPrompt.length} chars · ~{Math.round(generatedPrompt.split(/\s+/).length)} words
              </div>
              <a
                href={`/prompts/new?content=${encodeURIComponent(generatedPrompt)}`}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Submit to Library
              </a>
            </div>
          )}

          {/* Tips */}
          <div className="mt-4 rounded-xl border bg-card p-4">
            <h4 className="font-medium text-sm mb-2">Pro Tips</h4>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              <li>• Be specific about the role — the more detail, the better</li>
              <li>• Include examples in your instructions when possible</li>
              <li>• Always specify the output format you expect</li>
              <li>• Add constraints to prevent unwanted responses</li>
              <li>• Test your prompt and iterate based on results</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

interface FieldDef {
  key: string;
  label: string;
  placeholder: string;
  textarea: boolean;
  options?: string[];
}

function FrameworkSection({ fields, values, onChange }: {
  fields: FieldDef[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
}) {
  return (
    <div className="space-y-4">
      {fields.map(field => (
        <div key={field.key}>
          <label className="text-sm font-medium block mb-1.5">{field.label}</label>
          {field.options ? (
            <div className="space-y-1.5">
              <input
                value={values[field.key] || ''}
                onChange={e => onChange(field.key, e.target.value)}
                placeholder={field.placeholder}
                className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <div className="flex flex-wrap gap-1.5">
                {field.options.map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => onChange(field.key, opt)}
                    className={`px-2 py-0.5 rounded-full text-xs border transition-colors ${
                      values[field.key] === opt ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-accent'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ) : field.textarea ? (
            <textarea
              value={values[field.key] || ''}
              onChange={e => onChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border bg-background text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          ) : (
            <input
              value={values[field.key] || ''}
              onChange={e => onChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          )}
        </div>
      ))}
    </div>
  );
}

function CustomBuilder({ sections, onChange }: {
  sections: Array<{ label: string; content: string }>;
  onChange: (sections: Array<{ label: string; content: string }>) => void;
}) {
  const addSection = () => {
    onChange([...sections, { label: `Section ${sections.length + 1}`, content: '' }]);
  };

  const removeSection = (idx: number) => {
    onChange(sections.filter((_, i) => i !== idx));
  };

  const updateSection = (idx: number, key: 'label' | 'content', value: string) => {
    const updated = [...sections];
    updated[idx] = { ...updated[idx], [key]: value };
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      {sections.map((section, idx) => (
        <div key={idx} className="rounded-xl border bg-card p-4 space-y-2">
          <div className="flex items-center gap-2">
            <input
              value={section.label}
              onChange={e => updateSection(idx, 'label', e.target.value)}
              placeholder="Section label"
              className="flex-1 px-3 py-1.5 rounded-lg border bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <button
              onClick={() => removeSection(idx)}
              className="text-muted-foreground hover:text-destructive transition-colors text-xs px-2 py-1 rounded hover:bg-destructive/10"
            >
              Remove
            </button>
          </div>
          <textarea
            value={section.content}
            onChange={e => updateSection(idx, 'content', e.target.value)}
            placeholder="Section content..."
            rows={2}
            className="w-full px-3 py-2 rounded-lg border bg-background text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      ))}
      <button
        onClick={addSection}
        className="w-full py-2 rounded-xl border border-dashed text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
      >
        + Add Section
      </button>
    </div>
  );
}
