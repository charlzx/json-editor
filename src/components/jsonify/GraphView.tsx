import { useState, useCallback, useMemo, useRef } from 'react';
import { TreeNode } from '@/lib/jsonUtils';
import { cn } from '@/lib/utils';
import { X, ChevronRight, ChevronDown, ZoomIn, ZoomOut, Maximize2, FileCode, CheckCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

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

const NODE_WIDTH = 190;
const NODE_HEIGHT = 48;
const HORIZONTAL_SPACING = 240;
const VERTICAL_SPACING = 68;

export function GraphView({ nodes }: GraphViewProps) {
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set(['root']));
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 60, y: 80 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

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

  // Calculate positions for all visible nodes using a clean tiered tree layout
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
      const hasChildren = node.children && node.children.length > 0;

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

  // Calculate SVG canvas size to cover everything plus safe margin
  const dimensions = useMemo(() => {
    if (positions.length === 0) return { width: 1000, height: 600 };
    const maxX = Math.max(...positions.map(p => p.x)) + NODE_WIDTH + 150;
    const maxY = Math.max(...positions.map(p => p.y)) + NODE_HEIGHT + 150;
    return { width: Math.max(1000, maxX), height: Math.max(600, maxY) };
  }, [positions]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('.interactive-node') || target.closest('.expand-btn') || target.closest('.canvas-controls')) {
      return; // prevent dragging on node clicks or button controls
    }
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
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
      case 'number': return 'hsl(213 100% 47%)';
      case 'boolean': return 'hsl(290 80% 60%)';
      case 'null': return 'hsl(var(--muted-foreground))';
      default: return 'hsl(var(--foreground))';
    }
  };

  const getTypeAbbreviation = (type: string) => {
    switch (type) {
      case 'object': return '{}';
      case 'array': return '[]';
      case 'string': return 'str';
      case 'number': return 'num';
      case 'boolean': return 'bool';
      case 'null': return 'null';
      default: return 'val';
    }
  };

  const getValuePreview = (node: TreeNode) => {
    if (node.type === 'object') return `${node.children.length} keys`;
    if (node.type === 'array') return `${node.children.length} items`;
    if (node.type === 'string') {
      const str = String(node.value);
      return str.length > 16 ? `"${str.slice(0, 16)}..."` : `"${str}"`;
    }
    return String(node.value);
  };

  const getActiveConnections = useMemo(() => {
    if (!selectedNode) return new Set<string>();
    const paths = new Set<string>();
    let current: TreeNode | null = selectedNode;
    while (current) {
      paths.add(current.path);
      current = current.parent;
    }
    return paths;
  }, [selectedNode]);

  if (nodes.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground font-medium bg-card/20 rounded-xl border border-border">
        <div className="flex flex-col items-center gap-2">
          <FileCode className="h-8 w-8 text-muted-foreground/60" />
          <span>No JSON content to map in graph</span>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="relative h-full w-full overflow-hidden bg-card rounded-xl border border-border select-none"
    >
      {/* ── Grid Canvas Background ── */}
      <div className="absolute inset-0 bg-background pointer-events-none opacity-20 dark:opacity-40" />

      {/* ── Controls Overlay ── */}
      <div className="canvas-controls absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-card/85 backdrop-blur-md border border-border/80 px-2 py-1.5 rounded-lg shadow-md">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 rounded-md hover:bg-muted hover:text-foreground text-muted-foreground"
          onClick={() => setZoom(z => Math.min(z + 0.15, 2.5))}
          title="Zoom In"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 rounded-md hover:bg-muted hover:text-foreground text-muted-foreground"
          onClick={() => setZoom(z => Math.max(z - 0.15, 0.4))}
          title="Zoom Out"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <div className="h-4 w-px bg-border/80 mx-0.5" />
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 rounded-md hover:bg-muted hover:text-foreground text-muted-foreground"
          onClick={() => { setZoom(1); setPan({ x: 60, y: 80 }); }}
          title="Reset View"
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>

      {/* ── Graph Inspector (Floating Glass Panel) ── */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ opacity: 0, x: -20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -20, scale: 0.95 }}
            transition={{ duration: 0.18 }}
            className="absolute top-4 left-4 z-20 w-80 rounded-xl border border-border/60 bg-card/90 backdrop-blur-xl p-5 shadow-xl"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                {/* Node Title & Type Chip */}
                <div className="flex items-center gap-2 flex-wrap mb-3.5">
                  <span
                    className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider text-background"
                    style={{ backgroundColor: getNodeColor(selectedNode.type) }}
                  >
                    {selectedNode.type}
                  </span>
                  <span className="font-mono text-sm font-semibold truncate text-foreground">
                    {selectedNode.key || 'JSON Root'}
                  </span>
                </div>

                {/* Info Fields */}
                <div className="space-y-3 font-mono text-[11px]">
                  <div>
                    <span className="text-muted-foreground block mb-1">Path</span>
                    <code className="bg-muted/80 border border-border px-1.5 py-0.5 rounded text-foreground break-all block">
                      {selectedNode.path}
                    </code>
                  </div>

                  {selectedNode.type !== 'object' && selectedNode.type !== 'array' ? (
                    <div>
                      <span className="text-muted-foreground block mb-1">Value</span>
                      <div className="p-2 rounded bg-muted/60 border border-border/50 text-foreground break-all max-h-32 overflow-auto select-text scrollbar-thin">
                        {selectedNode.type === 'string' ? `"${selectedNode.value}"` : String(selectedNode.value)}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted/30 p-2 rounded-lg border border-border/50">
                      <span>Structure size</span>
                      <span className="font-semibold text-foreground">
                        {selectedNode.children.length} {selectedNode.children.length === 1 ? 'element' : 'elements'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Close Button */}
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0 rounded-md hover:bg-muted text-muted-foreground"
                onClick={() => setSelectedNode(null)}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Interactive Viewport Canvas ── */}
      <div
        className={cn(
          "h-full w-full cursor-grab active:cursor-grabbing overflow-auto relative",
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
            transition: isDragging ? 'none' : 'transform 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
          className="bg-transparent"
        >
          {/* SVG Dotted Grid Pattern */}
          <defs>
            <pattern id="dot-grid" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="3" cy="3" r="1.2" fill="currentColor" className="text-muted-foreground/15 dark:text-muted-foreground/10" />
            </pattern>
          </defs>

          {/* Endless Grid fill */}
          <rect width="100%" height="100%" fill="url(#dot-grid)" />

          {/* ── Connection Paths ── */}
          {positions.map(({ node, x, y, parentX, parentY }) => {
            if (parentX === undefined || parentY === undefined) return null;
            const startX = parentX;
            const startY = parentY;
            const endX = x;
            const endY = y + NODE_HEIGHT / 2;
            const midX = (startX + endX) / 2;

            // Highlight path leading to selected node
            const isActive = getActiveConnections.has(node.path);

            return (
              <g key={`path-group-${node.path}`}>
                <path
                  d={`M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`}
                  fill="none"
                  stroke={isActive ? 'hsl(var(--accent))' : 'currentColor'}
                  strokeWidth={isActive ? '2.5' : '1.5'}
                  className={cn(
                    "text-border/60 transition-all duration-300",
                    isActive ? "stroke-accent" : "dark:text-border/40"
                  )}
                  style={{
                    filter: isActive ? 'drop-shadow(0 0 3px hsl(var(--accent) / 0.4))' : 'none'
                  }}
                />
              </g>
            );
          })}

          {/* ── SVG Nodes ── */}
          {positions.map(({ node, x, y, isExpanded }) => {
            const hasChildren = node.children && node.children.length > 0;
            const isSelected = selectedNode?.path === node.path;
            const isActive = getActiveConnections.has(node.path);

            return (
              <g
                key={`node-group-${node.path}`}
                transform={`translate(${x}, ${y})`}
                className="interactive-node cursor-pointer group"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedNode(node);
                }}
              >
                {/* Node box shadow glow (only on active/selected) */}
                {(isSelected || isActive) && (
                  <rect
                    x="-4"
                    y="-4"
                    width={NODE_WIDTH + 8}
                    height={NODE_HEIGHT + 8}
                    rx="12"
                    fill="none"
                    stroke={isSelected ? getNodeColor(node.type) : 'hsl(var(--accent))'}
                    strokeWidth="1.5"
                    className="opacity-45 dark:opacity-30 blur-[2px]"
                  />
                )}

                {/* Node Box */}
                <rect
                  width={NODE_WIDTH}
                  height={NODE_HEIGHT}
                  rx="10"
                  fill="hsl(var(--card))"
                  stroke={isSelected ? getNodeColor(node.type) : (isActive ? 'hsl(var(--accent))' : 'hsl(var(--border))')}
                  strokeWidth={isSelected ? 2 : 1}
                  className="transition-all duration-200 fill-card group-hover:stroke-foreground/30"
                />

                {/* Vertical Type Ribbon Accent */}
                <rect
                  x="0"
                  y="0"
                  width="5"
                  height={NODE_HEIGHT}
                  rx="10"
                  ry="0"
                  fill={getNodeColor(node.type)}
                  clipPath="inset(0 0 0 0 round 10px 0 0 10px)"
                />
                {/* Make it flat on the inner right side */}
                <rect
                  x="0"
                  y="0"
                  width="5"
                  height={NODE_HEIGHT}
                  fill={getNodeColor(node.type)}
                />

                {/* Type Abbreviation Badge Box */}
                <rect
                  x="14"
                  y="14"
                  width="32"
                  height="20"
                  rx="5"
                  fill="hsl(var(--muted)/80)"
                  className="group-hover:fill-muted transition-colors"
                />

                {/* Type Abbreviation Text */}
                <text
                  x="30"
                  y="27"
                  textAnchor="middle"
                  fontSize="9"
                  fontWeight="700"
                  fontFamily="monospace"
                  fill={getNodeColor(node.type)}
                >
                  {getTypeAbbreviation(node.type)}
                </text>

                {/* Key Name Text */}
                <text
                  x="56"
                  y="23"
                  fontSize="11"
                  fontWeight="600"
                  fontFamily="var(--font-sans), system-ui"
                  fill="hsl(var(--foreground))"
                >
                  {node.key ? (node.key.length > 14 ? node.key.slice(0, 14) + '…' : node.key) : 'JSON'}
                </text>

                {/* Value Preview Text */}
                <text
                  x="56"
                  y="37"
                  fontSize="10"
                  fontFamily="monospace"
                  fill="hsl(var(--muted-foreground))"
                >
                  {getValuePreview(node)}
                </text>

                {/* Expand / Collapse Button */}
                {hasChildren && (
                  <g
                    transform={`translate(${NODE_WIDTH - 24}, ${(NODE_HEIGHT - 18) / 2})`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpand(node.path);
                    }}
                    className="expand-btn cursor-pointer"
                  >
                    <rect
                      width="18"
                      height="18"
                      rx="4"
                      fill="hsl(var(--muted)/80)"
                      className="hover:fill-[hsl(var(--foreground)/15)] transition-colors fill-muted/80"
                    />
                    {isExpanded ? (
                      <ChevronDown
                        x="2"
                        y="2"
                        width="14"
                        height="14"
                        stroke="hsl(var(--foreground))"
                        strokeWidth="2"
                      />
                    ) : (
                      <ChevronRight
                        x="2"
                        y="2"
                        width="14"
                        height="14"
                        stroke="hsl(var(--foreground))"
                        strokeWidth="2"
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