import { useState } from 'react';
import { ChevronRight, ChevronDown, Copy, Check, Braces, Brackets, Type, Hash, ToggleLeft, Ban } from 'lucide-react';
import { TreeNode } from '@/lib/jsonUtils';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

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

  return (
    <div className="select-none">
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className={cn(
          'group flex items-center gap-1.5 rounded-md px-2 py-1 transition-all hover:bg-muted/80 hover-lift',
          isExpandable && 'cursor-pointer'
        )}
        onClick={() => isExpandable && setIsExpanded(!isExpanded)}
      >
        {isExpandable ? (
          <motion.div
            animate={{ rotate: isExpanded ? 90 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </motion.div>
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
          className="ml-auto opacity-0 transition-all group-hover:opacity-100 ripple rounded p-1 hover:bg-accent/10"
          title="Copy path"
        >
          {copied ? (
            <Check className="h-3 w-3 text-accent animate-scale-in" />
          ) : (
            <Copy className="h-3 w-3 text-muted-foreground hover:text-foreground" />
          )}
        </button>
      </motion.div>

      <AnimatePresence>
        {isExpandable && isExpanded && hasChildren && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="ml-4 border-l-2 border-primary/20 pl-3 mt-1"
          >
            {node.children.map((child, index) => (
              <TreeNodeItem key={`${child.path}-${index}`} node={child} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
