import { useState, useMemo, useCallback } from 'react';
import { ChevronRight, ChevronDown, Copy, Check, Braces, Brackets, Type, Hash, ToggleLeft, Ban } from 'lucide-react';
import { TreeNode } from '@/lib/jsonUtils';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface TreeViewProps {
  nodes: TreeNode[];
}

// Flatten tree structure for virtual scrolling
interface FlatTreeNode {
  node: TreeNode;
  depth: number;
  index: number;
  parentPath: string;
}

function flattenTree(nodes: TreeNode[], expandedPaths: Set<string>, depth = 0, parentPath = ''): FlatTreeNode[] {
  const result: FlatTreeNode[] = [];
  
  nodes.forEach((node, index) => {
    const currentPath = parentPath ? `${parentPath}.${node.key}` : node.key;
    result.push({ node, depth, index, parentPath: currentPath });
    
    const isExpandable = node.type === 'object' || node.type === 'array';
    if (isExpandable && expandedPaths.has(currentPath) && node.children.length > 0) {
      result.push(...flattenTree(node.children, expandedPaths, depth + 1, currentPath));
    }
  });
  
  return result;
}

export function TreeView({ nodes }: TreeViewProps) {
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(() => {
    // Auto-expand first level
    const initialExpanded = new Set<string>();
    nodes.forEach(node => {
      initialExpanded.add(node.key);
    });
    return initialExpanded;
  });

  const toggleExpanded = useCallback((path: string) => {
    setExpandedPaths(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  const flatNodes = useMemo(() => 
    flattenTree(nodes, expandedPaths),
    [nodes, expandedPaths]
  );

  if (nodes.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        No data to display
      </div>
    );
  }

  return (
    <div className="p-4 font-mono text-sm">
      {flatNodes.map((flatNode) => (
        <TreeNodeItem 
          key={flatNode.parentPath} 
          node={flatNode.node}
          depth={flatNode.depth}
          path={flatNode.parentPath}
          isExpanded={expandedPaths.has(flatNode.parentPath)}
          onToggle={toggleExpanded}
        />
      ))}
    </div>
  );
}

function TreeNodeItem({ 
  node, 
  depth, 
  path, 
  isExpanded, 
  onToggle 
}: { 
  node: TreeNode; 
  depth: number; 
  path: string; 
  isExpanded: boolean;
  onToggle: (path: string) => void;
}) {
  const [copied, setCopied] = useState(false);

  const hasChildren = node.children.length > 0;
  const isExpandable = node.type === 'object' || node.type === 'array';

  const copyPath = () => {
    navigator.clipboard.writeText(path);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const getValueDisplay = () => {
    if (node.type === 'object') {
      return (
        <span className="flex items-center gap-1">
          <Braces className="h-3.5 w-3.5 text-blue-500" />
          <span className="text-muted-foreground">{`{${node.children.length}}`}</span>
        </span>
      );
    }
    if (node.type === 'array') {
      return (
        <span className="flex items-center gap-1">
          <Brackets className="h-3.5 w-3.5 text-purple-500" />
          <span className="text-muted-foreground">{`[${node.children.length}]`}</span>
        </span>
      );
    }
    if (node.type === 'string') {
      return (
        <span className="flex items-center gap-1">
          <Type className="h-3 w-3 text-green-500" />
          <span className="syntax-string">"{String(node.value)}"</span>
        </span>
      );
    }
    if (node.type === 'number') {
      return (
        <span className="flex items-center gap-1">
          <Hash className="h-3 w-3 text-orange-500" />
          <span className="syntax-number">{String(node.value)}</span>
        </span>
      );
    }
    if (node.type === 'boolean') {
      return (
        <span className="flex items-center gap-1">
          <ToggleLeft className="h-3.5 w-3.5 text-yellow-500" />
          <span className="syntax-boolean">{String(node.value)}</span>
        </span>
      );
    }
    if (node.type === 'null') {
      return (
        <span className="flex items-center gap-1">
          <Ban className="h-3 w-3 text-red-500" />
          <span className="syntax-null">null</span>
        </span>
      );
    }
    return String(node.value);
  };

  if (node.key === '...') {
    return (
      <div className="select-none" style={{ marginLeft: `${depth * 16}px` }}>
        <div className="flex items-center gap-2 rounded-md px-3 py-1.5 bg-muted/30 border border-border/40 text-muted-foreground/60 text-xs italic font-medium my-0.5 max-w-md">
          <span className="w-1.5 h-1.5 rounded-full bg-accent/40 animate-pulse shrink-0" />
          <span>{String(node.value)}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="select-none" style={{ marginLeft: `${depth * 16}px` }}>
      <div
        className={cn(
          'group flex items-center gap-1.5 rounded-md px-2 py-1 transition-all hover:bg-muted/80',
          isExpandable && 'cursor-pointer'
        )}
        onClick={() => isExpandable && onToggle(path)}
      >
        {isExpandable ? (
          <div
            style={{
              transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s',
            }}
          >
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
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
          className="ml-auto opacity-0 transition-all group-hover:opacity-100 rounded p-1 hover:bg-accent/10"
          title="Copy path"
        >
          {copied ? (
            <Check className="h-3 w-3 text-accent" />
          ) : (
            <Copy className="h-3 w-3 text-muted-foreground hover:text-foreground" />
          )}
        </button>
      </div>
    </div>
  );
}
