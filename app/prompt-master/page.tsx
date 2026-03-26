import { PromptMasterClient } from '@/components/prompts/PromptMasterClient';
import { Zap, Target, Layers, Star } from 'lucide-react';

export default function PromptMasterPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 text-sm font-medium mb-4">
          <Zap className="w-4 h-4" />
          AI-Powered Prompt Builder
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold mb-3">
          Prompt Master
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Build highly optimized prompts using proven frameworks. Structure your ideas with role,
          context, task, and output format components for maximum effectiveness.
        </p>
      </div>

      {/* Framework Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {[
          { icon: Target, label: 'RISEN Framework', desc: 'Role, Instructions, Steps, End Goal, Narrowing', color: 'text-violet-600 bg-violet-50 dark:bg-violet-900/20' },
          { icon: Layers, label: 'CRISPE Method', desc: 'Capacity, Role, Insight, Statement, Personality, Experiment', color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' },
          { icon: Star, label: 'COAT Structure', desc: 'Context, Objective, Action, Tone', color: 'text-orange-600 bg-orange-50 dark:bg-orange-900/20' },
          { icon: Zap, label: 'RTF Pattern', desc: 'Role, Task, Format — quick and effective', color: 'text-green-600 bg-green-50 dark:bg-green-900/20' },
        ].map(({ icon: Icon, label, desc, color }) => (
          <div key={label} className="rounded-xl border bg-card p-4 text-center">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-2 ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="font-medium text-sm">{label}</div>
            <div className="text-xs text-muted-foreground mt-1">{desc}</div>
          </div>
        ))}
      </div>

      <PromptMasterClient />
    </div>
  );
}
