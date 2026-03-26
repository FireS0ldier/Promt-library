import { VerificationReport } from '@/types';
import { cn } from '@/lib/utils';
import { CheckCircle, AlertTriangle, XCircle, Clock, Shield } from 'lucide-react';

interface VerificationBadgeProps {
  report: VerificationReport;
  compact?: boolean;
}

const statusConfig = {
  passed: { icon: CheckCircle, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800', label: 'Verified' },
  warning: { icon: AlertTriangle, color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800', label: 'Warning' },
  failed: { icon: XCircle, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800', label: 'Failed' },
  pending: { icon: Clock, color: 'text-gray-500', bg: 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700', label: 'Pending' },
  running: { icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800', label: 'Checking...' },
};

export function VerificationBadge({ report, compact = false }: VerificationBadgeProps) {
  const config = statusConfig[report.overall_status];
  const Icon = config.icon;

  if (compact) {
    return (
      <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border', config.bg, config.color)}>
        <Icon className="w-3 h-3" />
        {report.overall_score}% · {config.label}
      </span>
    );
  }

  return (
    <div className={cn('rounded-xl border p-4 space-y-3', config.bg)}>
      <div className="flex items-center justify-between">
        <div className={cn('flex items-center gap-2 font-semibold', config.color)}>
          <Icon className="w-5 h-5" />
          Verification Report
        </div>
        <div className="flex items-center gap-2">
          <div className={cn('text-2xl font-bold', config.color)}>{report.overall_score}%</div>
          <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium border', config.bg, config.color)}>
            {config.label}
          </span>
        </div>
      </div>

      {/* Individual checks */}
      <div className="space-y-2">
        {report.results.map((result) => {
          const rConfig = statusConfig[result.status];
          const RIcon = rConfig.icon;
          return (
            <div key={result.check} className="flex items-start gap-2.5 text-sm">
              <RIcon className={cn('w-4 h-4 shrink-0 mt-0.5', rConfig.color)} />
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-foreground">{result.check}</span>
                  <span className={cn('text-xs font-mono font-bold', rConfig.color)}>{result.score}%</span>
                </div>
                <p className="text-muted-foreground text-xs mt-0.5">{result.message}</p>
                {result.details && (
                  <p className="text-muted-foreground text-xs mt-0.5 italic">{result.details}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-xs text-muted-foreground">
        Checked {new Date(report.checked_at).toLocaleString()}
      </div>
    </div>
  );
}
