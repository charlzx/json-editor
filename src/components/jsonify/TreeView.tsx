import { useState } from 'react';
import { ChevronRight, ChevronDown, Copy, Check } from 'lucide-react';
import { TreeNode } from '@/lib/jsonUtils';
import { cn } from '@/lib/utils';

interface TreeViewProps {
  nodes: TreeNode[];
}

export function TreeView({ nodes }: TreeViewProps) {
  if (nodes.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        No data to display
      </div>
    );
  }

  return (
    <div className="p-4 font-mono text-sm">
      {nodes.map((node, index) => (
        <TreeNodeItem key={`${node.path}-${index}`} node={node} />
      ))}
    </div>
  );
}

function TreeNodeItem({ node }: { node: TreeNode }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [copied, setCopied] = useState(false);

  const hasChildren = node.children.length > 0;
  const isExpandable = node.type === 'object' || node.type === 'array';

  const copyPath = () => {
    navigator.clipboard.writeText(node.path);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const getValueDisplay = () => {
    if (node.type === 'object') {
      return <span className="text-muted-foreground">{`{${node.children.length}}`}</span>;
    }
    if (node.type === 'array') {
      return <span className="text-muted-foreground">{`[${node.children.length}]`}</span>;
    }
    if (node.type === 'string') {
      return <span className="syntax-string">"{String(node.value)}"</span>;
    }
    if (node.type === 'number') {
      return <span className="syntax-number">{String(node.value)}</span>;
    }
    if (node.type === 'boolean') {
      return <span className="syntax-boolean">{String(node.value)}</span>;
    }
    if (node.type === 'null') {
      return <span className="syntax-null">null</span>;
    }
    return String(node.value);
  };

  return (
    <div className="select-none">
      <div
        className={cn(
          'group flex items-center gap-1 rounded px-1 py-0.5 hover:bg-muted',
          isExpandable && 'cursor-pointer'
        )}
        onClick={() => isExpandable && setIsExpanded(!isExpanded)}
      >
        {isExpandable ? (
          isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )
        ) : (
          <span className="w-4" />
        )}

        <span className="syntax-key">{node.key}</span>
        <span className="text-muted-foreground">:</span>
        <span className="ml-1">{getValueDisplay()}</span>

        <button
          onClick={(e) => {
            e.stopPropagation();
            copyPath();
          }}
          className="ml-2 opacity-0 transition-opacity group-hover:opacity-100"
          title="Copy path"
        >
          {copied ? (
            <Check className="h-3 w-3 text-accent" />
          ) : (
            <Copy className="h-3 w-3 text-muted-foreground hover:text-foreground" />
          )}
        </button>
      </div>

      {isExpandable && isExpanded && hasChildren && (
        <div className="ml-4 border-l border-border pl-2">
          {node.children.map((child, index) => (
            <TreeNodeItem key={`${child.path}-${index}`} node={child} />
          ))}
        </div>
      )}
    </div>
  );
}
