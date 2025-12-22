import { X, Trash2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HistoryItem } from '@/hooks/useJsonHistory';
import { formatDistanceToNow } from 'date-fns';

interface HistoryPanelProps {
  history: HistoryItem[];
  onSelect: (json: string) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
  onClose: () => void;
}

export function HistoryPanel({ 
  history, 
  onSelect, 
  onRemove, 
  onClear, 
  onClose 
}: HistoryPanelProps) {
  return (
    <div className="flex h-full w-80 flex-col border-l border-border bg-card animate-slide-in-right">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          <h3 className="font-semibold">History</h3>
        </div>
        <div className="flex items-center gap-1">
          {history.length > 0 && (
            <Button variant="ghost" size="sm" onClick={onClear}>
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* History list */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {history.length === 0 ? (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <p className="text-center text-sm">
              No history yet.<br />
              Format some JSON to get started.
            </p>
          </div>
        ) : (
          <div className="p-2">
            {history.map((item) => (
              <div
                key={item.id}
                className="group relative mb-2 cursor-pointer rounded-lg border border-border bg-muted/50 p-3 transition-colors hover:bg-muted"
                onClick={() => onSelect(item.json)}
              >
                <p className="font-mono text-xs text-foreground line-clamp-3">
                  {item.preview}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {formatDistanceToNow(item.timestamp, { addSuffix: true })}
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(item.id);
                  }}
                  className="absolute right-2 top-2 rounded p-1 opacity-0 transition-opacity hover:bg-destructive/20 group-hover:opacity-100"
                >
                  <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
