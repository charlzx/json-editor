import { X, Trash2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HistoryItem } from '@/hooks/useJsonHistory';
import { motion, AnimatePresence } from 'framer-motion';

// Simple time ago formatter
function formatTimeAgo(timestamp: number | Date): string {
  const now = new Date();
  const timestampDate = typeof timestamp === 'number' ? new Date(timestamp) : timestamp;
  const seconds = Math.floor((now.getTime() - timestampDate.getTime()) / 1000);
  
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  const years = Math.floor(days / 365);
  return `${years}y ago`;
}

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
    <div className="flex h-full w-80 flex-col border-l border-border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3 glass-subtle">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          <h3 className="font-semibold">History</h3>
        </div>
        <div className="flex items-center gap-1">
          {history.length > 0 && (
            <Button variant="ghost" size="sm" onClick={onClear} className="ripple hover-lift">
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={onClose} className="ripple">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* History list */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {history.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex h-full items-center justify-center text-muted-foreground"
          >
            <p className="text-center text-sm">
              No history yet.<br />
              Format some JSON to get started.
            </p>
          </motion.div>
        ) : (
          <div className="p-2 space-y-2">
            <AnimatePresence>
              {history.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  className="group relative cursor-pointer rounded-lg glass hover:glass-strong p-3 transition-all hover-lift"
                  onClick={() => onSelect(item.json)}
                >
                  <p className="font-mono text-xs text-foreground line-clamp-3">
                    {item.preview}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {formatTimeAgo(item.timestamp)}
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(item.id);
                    }}
                    className="absolute right-2 top-2 rounded p-1 opacity-0 transition-opacity hover:bg-destructive/20 group-hover:opacity-100 ripple"
                  >
                    <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
