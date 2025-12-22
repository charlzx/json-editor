import { 
  Wand2, 
  Minimize2, 
  Copy, 
  Check, 
  Trash2, 
  Share2, 
  History,
  FileJson,
  TreePine,
  ChevronDown,
  Undo2,
  GitBranch
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useState } from 'react';

interface ToolbarProps {
  onFormat: (indent: number) => void;
  onMinify: () => void;
  onUndo: () => void;
  onCopy: () => void;
  onClear: () => void;
  onShare: () => void;
  onToggleHistory: () => void;
  onToggleTree: () => void;
  onToggleGraph: () => void;
  onToggleSchema: () => void;
  isTreeVisible: boolean;
  isGraphVisible: boolean;
  isSchemaVisible: boolean;
  isValid: boolean;
  hasContent: boolean;
  canUndo: boolean;
}

export function Toolbar({
  onFormat,
  onMinify,
  onUndo,
  onCopy,
  onClear,
  onShare,
  onToggleHistory,
  onToggleTree,
  onToggleGraph,
  onToggleSchema,
  isTreeVisible,
  isGraphVisible,
  isSchemaVisible,
  isValid,
  hasContent,
  canUndo,
}: ToolbarProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card p-2">
      {/* Format dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="default" 
            size="sm" 
            disabled={!isValid || !hasContent}
            className="gap-1"
          >
            <Wand2 className="h-4 w-4" />
            Format
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="bg-popover">
          <DropdownMenuItem onClick={() => onFormat(2)}>
            2 spaces
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onFormat(4)}>
            4 spaces
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onFormat(1)}>
            1 tab (as space)
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button 
        variant="outline" 
        size="sm" 
        onClick={onMinify}
        disabled={!isValid || !hasContent}
      >
        <Minimize2 className="h-4 w-4 mr-1" />
        Minify
      </Button>

      <Button 
        variant="outline" 
        size="sm" 
        onClick={onUndo}
        disabled={!canUndo}
      >
        <Undo2 className="h-4 w-4 mr-1" />
        Undo
      </Button>

      <div className="h-6 w-px bg-border" />

      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleCopy}
        disabled={!hasContent}
      >
        {copied ? (
          <Check className="h-4 w-4 mr-1 text-accent" />
        ) : (
          <Copy className="h-4 w-4 mr-1" />
        )}
        {copied ? 'Copied!' : 'Copy'}
      </Button>

      <Button 
        variant="outline" 
        size="sm" 
        onClick={onClear}
        disabled={!hasContent}
      >
        <Trash2 className="h-4 w-4 mr-1" />
        Clear
      </Button>

      <div className="h-6 w-px bg-border" />

      <Button 
        variant={isTreeVisible ? 'default' : 'outline'}
        size="sm" 
        onClick={onToggleTree}
        disabled={!isValid || !hasContent}
        className={isTreeVisible ? 'bg-primary text-primary-foreground ring-2 ring-primary/30' : ''}
      >
        <TreePine className="h-4 w-4 mr-1" />
        Tree
      </Button>

      <Button 
        variant={isGraphVisible ? 'default' : 'outline'}
        size="sm" 
        onClick={onToggleGraph}
        disabled={!isValid || !hasContent}
        className={isGraphVisible ? 'bg-accent text-accent-foreground ring-2 ring-accent/30' : ''}
      >
        <GitBranch className="h-4 w-4 mr-1" />
        Graph
      </Button>

      <Button 
        variant={isSchemaVisible ? 'secondary' : 'outline'}
        size="sm" 
        onClick={onToggleSchema}
      >
        <FileJson className="h-4 w-4 mr-1" />
        Schema
      </Button>

      <div className="flex-1" />

      <Button 
        variant="ghost" 
        size="sm" 
        onClick={onToggleHistory}
      >
        <History className="h-4 w-4 mr-1" />
        History
      </Button>

      <Button 
        variant="outline" 
        size="sm" 
        onClick={onShare}
        disabled={!isValid || !hasContent}
        className="border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground"
      >
        <Share2 className="h-4 w-4 mr-1" />
        Share
      </Button>
    </div>
  );
}
