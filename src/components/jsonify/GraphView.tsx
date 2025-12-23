import { useState, useCallback, useMemo } from 'react';
import { TreeNode } from '@/lib/jsonUtils';
import { cn } from '@/lib/utils';
import { X, ChevronRight, ChevronDown, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

interface GraphViewProps {
  nodes: TreeNode[];
}

interface NodePosition {
  node: TreeNode;
  x: number;
  y: number;
  parentX?: number;
  parentY?: number;
  depth: number;
  isExpanded: boolean;
}

const NODE_WIDTH = 160;
const NODE_HEIGHT = 44;
const HORIZONTAL_SPACING = 200;
const VERTICAL_SPACING = 60;

export function GraphView({ nodes }: GraphViewProps) {
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set(['root']));
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 50, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const toggleExpand = useCallback((path: string) => {
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

  // Calculate positions for all visible nodes
  const positions = useMemo(() => {
    const result: NodePosition[] = [];
    let yOffset = 0;

    const processNode = (
      node: TreeNode,
      depth: number,
      parentX?: number,
      parentY?: number
    ) => {
      const x = depth * HORIZONTAL_SPACING;
      const y = yOffset * VERTICAL_SPACING;
      const isExpanded = expandedPaths.has(node.path);
      const hasChildren = node.children.length > 0;

      result.push({
        node,
        x,
        y,
        parentX,
        parentY,
        depth,
        isExpanded,
      });

      yOffset++;

      if (hasChildren && isExpanded) {
        node.children.forEach(child => {
          processNode(child, depth + 1, x + NODE_WIDTH, y + NODE_HEIGHT / 2);
        });
      }
    };

    // Create root parent node
    const rootNode: TreeNode = {
      key: 'JSON',
      value: nodes.length === 1 && nodes[0].key === '' ? nodes[0].value : null,
      type: nodes.length === 1 && nodes[0].key === '' ? nodes[0].type : 'object',
      path: 'root',
      children: nodes,
      parent: null,
    };

    processNode(rootNode, 0);

    return result;
  }, [nodes, expandedPaths]);

  // Calculate SVG dimensions
  const dimensions = useMemo(() => {
    if (positions.length === 0) return { width: 800, height: 400 };
    const maxX = Math.max(...positions.map(p => p.x)) + NODE_WIDTH + 100;
    const maxY = Math.max(...positions.map(p => p.y)) + NODE_HEIGHT + 100;
    return { width: Math.max(800, maxX), height: Math.max(400, maxY) };
  }, [positions]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).tagName === 'svg') {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  }, [pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'object': return 'hsl(var(--primary))';
      case 'array': return 'hsl(var(--accent))';
      case 'string': return 'hsl(142 70% 45%)';
      case 'number': return 'hsl(200 90% 50%)';
      case 'boolean': return 'hsl(280 80% 60%)';
      case 'null': return 'hsl(var(--muted-foreground))';
      default: return 'hsl(var(--foreground))';
    }
  };

  const getValuePreview = (node: TreeNode) => {
    if (node.type === 'object') return `{${node.children.length}}`;
    if (node.type === 'array') return `[${node.children.length}]`;
    if (node.type === 'string') {
      const str = String(node.value);
      return str.length > 12 ? `"${str.slice(0, 12)}..."` : `"${str}"`;
    }
    return String(node.value);
  };

  if (nodes.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        No data to visualize
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-card rounded-lg border border-border">
      {/* Controls */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-3 right-3 z-10 flex gap-1"
      >
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 glass ripple hover-lift"
          onClick={() => setZoom(z => Math.min(z + 0.2, 3))}
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 glass ripple hover-lift"
          onClick={() => setZoom(z => Math.max(z - 0.2, 0.3))}
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 glass ripple hover-lift"
          onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
      </motion.div>

      {/* Selected node info panel */}
      {selectedNode && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="absolute bottom-3 left-3 right-3 z-10 max-w-md rounded-lg glass-strong p-4 shadow-xl border border-border/30"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span 
                  className="px-2 py-0.5 rounded text-xs font-mono font-medium text-background"
                  style={{ backgroundColor: getNodeColor(selectedNode.type) }}
                >
                  {selectedNode.type}
                </span>
                <span className="font-mono text-sm font-semibold truncate">
                  {selectedNode.key}
                </span>
              </div>
              <div className="text-xs text-muted-foreground mb-1">
                Path: <code className="bg-muted px-1 rounded">{selectedNode.path}</code>
              </div>
              {selectedNode.type !== 'object' && selectedNode.type !== 'array' && (
                <div className="mt-2 p-2 rounded bg-muted font-mono text-sm break-all max-h-20 overflow-auto">
                  {selectedNode.type === 'string' ? `"${selectedNode.value}"` : String(selectedNode.value)}
                </div>
              )}
              {(selectedNode.type === 'object' || selectedNode.type === 'array') && (
                <div className="text-sm text-muted-foreground">
                  {selectedNode.children.length} {selectedNode.children.length === 1 ? 'child' : 'children'}
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0 ripple"
              onClick={() => setSelectedNode(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      )}

      {/* Graph canvas */}
      <div
        className={cn(
          "h-full w-full cursor-grab overflow-auto",
          isDragging && "cursor-grabbing"
        )}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <svg
          width={dimensions.width * zoom}
          height={dimensions.height * zoom}
          viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px)`,
            transformOrigin: '0 0',
            minWidth: '100%',
            minHeight: '100%',
          }}
        >
          {/* Connection lines */}
          {positions.map(({ node, x, y, parentX, parentY }) => {
            if (parentX === undefined || parentY === undefined) return null;
            const startX = parentX;
            const startY = parentY;
            const endX = x;
            const endY = y + NODE_HEIGHT / 2;
            const midX = (startX + endX) / 2;

            return (
              <path
                key={`line-${node.path}`}
                d={`M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`}
                fill="none"
                stroke="hsl(var(--border))"
                strokeWidth="2"
                className="transition-all duration-200"
              />
            );
          })}

          {/* Nodes */}
          {positions.map(({ node, x, y, isExpanded }) => {
            const hasChildren = node.children.length > 0;
            const isSelected = selectedNode?.path === node.path;

            return (
              <g
                key={`node-${node.path}`}
                transform={`translate(${x}, ${y})`}
                className="cursor-pointer hover-glow"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedNode(node);
                }}
              >
                {/* Node background */}
                <rect
                  width={NODE_WIDTH}
                  height={NODE_HEIGHT}
                  rx="8"
                  fill="hsl(var(--card))"
                  stroke={isSelected ? getNodeColor(node.type) : 'hsl(var(--border))'}
                  strokeWidth={isSelected ? 2 : 1}
                  className="transition-all duration-200"
                  style={{
                    filter: isSelected ? 'drop-shadow(0 0 8px currentColor)' : 'none'
                  }}
                />

                {/* Type indicator */}
                <rect
                  x="0"
                  y="0"
                  width="6"
                  height={NODE_HEIGHT}
                  rx="8"
                  ry="0"
                  fill={getNodeColor(node.type)}
                  clipPath="inset(0 0 0 0 round 8px 0 0 8px)"
                />
                <rect
                  x="0"
                  y="0"
                  width="6"
                  height={NODE_HEIGHT}
                  fill={getNodeColor(node.type)}
                />

                {/* Key name */}
                <text
                  x="14"
                  y="18"
                  fontSize="12"
                  fontWeight="600"
                  fontFamily="monospace"
                  fill="hsl(var(--foreground))"
                >
                  {node.key.length > 14 ? node.key.slice(0, 14) + '...' : node.key}
                </text>

                {/* Value preview */}
                <text
                  x="14"
                  y="34"
                  fontSize="10"
                  fontFamily="monospace"
                  fill="hsl(var(--muted-foreground))"
                >
                  {getValuePreview(node)}
                </text>

                {/* Expand/collapse button */}
                {hasChildren && (
                  <g
                    transform={`translate(${NODE_WIDTH - 24}, ${(NODE_HEIGHT - 16) / 2})`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpand(node.path);
                    }}
                    className="cursor-pointer"
                  >
                    <rect
                      width="20"
                      height="20"
                      rx="4"
                      fill="hsl(var(--muted))"
                      className="hover:fill-[hsl(var(--accent))] transition-colors"
                    />
                    {isExpanded ? (
                      <ChevronDown
                        x="2"
                        y="2"
                        width="16"
                        height="16"
                        stroke="hsl(var(--foreground))"
                      />
                    ) : (
                      <ChevronRight
                        x="2"
                        y="2"
                        width="16"
                        height="16"
                        stroke="hsl(var(--foreground))"
                      />
                    )}
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}