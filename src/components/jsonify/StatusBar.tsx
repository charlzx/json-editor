import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { JsonStats, ValidationResult } from '@/lib/jsonUtils';
import { cn } from '@/lib/utils';

interface StatusBarProps {
  validation: ValidationResult;
  stats: JsonStats;
  hasContent: boolean;
}

export function StatusBar({ validation, stats, hasContent }: StatusBarProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-2 text-sm">
      <div className="flex items-center gap-4">
        {/* Validation status */}
        {!hasContent ? (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            <span>Waiting for input...</span>
          </div>
        ) : validation.valid ? (
          <div className="flex items-center gap-1.5 text-accent">
            <CheckCircle2 className="h-4 w-4" />
            <span>Valid JSON</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-destructive">
            <XCircle className="h-4 w-4" />
            <span className="max-w-md truncate">
              {validation.error?.line 
                ? `Line ${validation.error.line}: ${validation.error.message}`
                : validation.error?.message}
            </span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-muted-foreground">
        <span className={cn(!hasContent && 'opacity-50')}>
          {stats.lines} {stats.lines === 1 ? 'line' : 'lines'}
        </span>
        <span className={cn(!hasContent && 'opacity-50')}>
          {stats.size}
        </span>
        {hasContent && validation.valid && (
          <>
            <span>{stats.keys} keys</span>
            <span>Depth: {stats.depth}</span>
          </>
        )}
      </div>
    </div>
  );
}
