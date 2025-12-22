import { useState, useEffect, useMemo, useCallback } from 'react';
import { TreePine, Maximize, Minimize, RotateCw } from 'lucide-react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { ThemeToggle } from '@/components/jsonify/ThemeToggle';
import { MonacoJsonEditor } from '@/components/jsonify/MonacoJsonEditor';
import { Toolbar } from '@/components/jsonify/Toolbar';
import { StatusBar } from '@/components/jsonify/StatusBar';
import { TreeView } from '@/components/jsonify/TreeView';
import { GraphView } from '@/components/jsonify/GraphView';
import { HistoryPanel } from '@/components/jsonify/HistoryPanel';
import { SchemaValidator } from '@/components/jsonify/SchemaValidator';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/useTheme';
import { useJsonHistory } from '@/hooks/useJsonHistory';
import { 
  validateJson, 
  formatJson, 
  minifyJson, 
  getJsonStats,
  buildTree,
  TreeNode
} from '@/lib/jsonUtils';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const Index = () => {
  const { isDark, toggleTheme } = useTheme();
  const { history, addToHistory, clearHistory, removeFromHistory } = useJsonHistory();
  
  const [json, setJson] = useState('');
  const [previousJson, setPreviousJson] = useState<string | null>(null);
  const [showTree, setShowTree] = useState(false);
  const [showGraph, setShowGraph] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showSchema, setShowSchema] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [splitOrientation, setSplitOrientation] = useState<'horizontal' | 'vertical'>('horizontal');

  // Load JSON from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const jsonParam = params.get('json');
    if (jsonParam) {
      try {
        const decoded = decodeURIComponent(jsonParam);
        setJson(decoded);
        window.history.replaceState({}, '', window.location.pathname);
      } catch {
        toast.error('Failed to load JSON from URL');
      }
    }
  }, []);

  const validation = useMemo(() => validateJson(json), [json]);
  const stats = useMemo(() => getJsonStats(json), [json]);
  const treeNodes = useMemo<TreeNode[]>(() => {
    if (!validation.valid) return [];
    try {
      return buildTree(JSON.parse(json));
    } catch {
      return [];
    }
  }, [json, validation.valid]);

  const hasContent = json.trim().length > 0;
  const canUndo = previousJson !== null;

  const handleFormat = useCallback((indent: number) => {
    try {
      const formatted = formatJson(json, indent);
      setPreviousJson(json);
      setJson(formatted);
      addToHistory(formatted);
      toast.success('JSON formatted');
    } catch {
      toast.error('Failed to format JSON');
    }
  }, [json, addToHistory]);

  const handleMinify = useCallback(() => {
    try {
      const minified = minifyJson(json);
      setPreviousJson(json);
      setJson(minified);
      addToHistory(minified);
      toast.success('JSON minified');
    } catch {
      toast.error('Failed to minify JSON');
    }
  }, [json, addToHistory]);

  const handleUndo = useCallback(() => {
    if (previousJson !== null) {
      setJson(previousJson);
      setPreviousJson(null);
      toast.success('Undone');
    }
  }, [previousJson]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(json);
    toast.success('Copied to clipboard');
  }, [json]);

  const handleClear = useCallback(() => {
    setJson('');
    setPreviousJson(null);
    toast.success('Editor cleared');
  }, []);

  const handleHistorySelect = useCallback((historyJson: string) => {
    setJson(historyJson);
    setShowHistory(false);
  }, []);

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type === 'application/json' || file.name.endsWith('.json')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target?.result as string;
          setPreviousJson(json);
          setJson(content);
          toast.success(`Loaded ${file.name}`);
        };
        reader.onerror = () => {
          toast.error('Failed to read file');
        };
        reader.readAsText(file);
      } else {
        toast.error('Please drop a JSON file');
      }
    }
  }, [json]);

  return (
    <div 
      className="flex h-screen flex-col bg-background"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 rounded-xl border-2 border-dashed border-primary p-12">
            <TreePine className="h-16 w-16 text-primary" />
            <p className="text-xl font-semibold text-foreground">Drop JSON file here</p>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="flex items-center justify-between border-b border-border px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <TreePine className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">JSON Tree</h1>
            <p className="text-xs text-muted-foreground">Format • Validate • Explore</p>
          </div>
        </div>
        <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
      </header>

      {/* Main content */}
      <main className="flex flex-1 flex-col gap-4 overflow-hidden p-4">
        {/* Toolbar */}
        <Toolbar
          onFormat={handleFormat}
          onMinify={handleMinify}
          onUndo={handleUndo}
          onCopy={handleCopy}
          onClear={handleClear}
          onToggleHistory={() => setShowHistory(!showHistory)}
          onToggleTree={() => { setShowTree(!showTree); if (!showTree) setShowGraph(false); }}
          onToggleGraph={() => { setShowGraph(!showGraph); if (!showGraph) setShowTree(false); }}
          onToggleSchema={() => setShowSchema(!showSchema)}
          isTreeVisible={showTree}
          isGraphVisible={showGraph}
          isSchemaVisible={showSchema}
          isValid={validation.valid}
          hasContent={hasContent}
          canUndo={canUndo}
        />

        {/* Schema validator (collapsible) */}
        <AnimatePresence>
          {showSchema && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <SchemaValidator json={json} isJsonValid={validation.valid} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Editor area */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="flex flex-1 gap-4 overflow-hidden"
        >
          {/* Main editor + visualization */}
          <div className="flex flex-1 overflow-hidden">
            {(showTree || showGraph) && validation.valid && hasContent ? (
              <ResizablePanelGroup direction={splitOrientation} className="h-full">
                <ResizablePanel defaultSize={50} minSize={30}>
                  <MonacoJsonEditor
                    value={json}
                    onChange={setJson}
                    errorLine={validation.error?.line}
                  />
                </ResizablePanel>
                <ResizableHandle withHandle className={splitOrientation === 'horizontal' ? 'mx-2' : 'my-2'} />
                <ResizablePanel defaultSize={50} minSize={25}>
                  <AnimatePresence mode="wait">
                    {showTree && (
                      <motion.div
                        key="tree"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                        className="h-full overflow-auto rounded-lg border border-border bg-card scrollbar-thin"
                      >
                        <TreeView nodes={treeNodes} />
                      </motion.div>
                    )}
                    {showGraph && (
                      <motion.div
                        key="graph"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                        className="h-full"
                      >
                        <GraphView nodes={treeNodes} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </ResizablePanel>
              </ResizablePanelGroup>
            ) : (
              <div className="flex-1">
                <MonacoJsonEditor
                  value={json}
                  onChange={setJson}
                  errorLine={validation.error?.line}
                />
              </div>
            )}
          </div>

          {/* History panel */}
          <AnimatePresence>
            {showHistory && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <HistoryPanel
                  history={history}
                  onSelect={handleHistorySelect}
                  onRemove={removeFromHistory}
                  onClear={clearHistory}
                  onClose={() => setShowHistory(false)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Status bar */}
        <StatusBar
          validation={validation}
          stats={stats}
          hasContent={hasContent}
        />
      </main>

      {/* Floating Action Buttons */}
      <AnimatePresence>
        {hasContent && validation.valid && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="fixed bottom-6 right-6 flex flex-col gap-2 z-20"
          >
            {/* Fullscreen Toggle */}
            <Button
              size="icon"
              className="h-12 w-12 rounded-full shadow-lg hover:shadow-xl glass hover-lift ripple"
              onClick={() => {
                if (!document.fullscreenElement) {
                  document.documentElement.requestFullscreen();
                  setIsFullscreen(true);
                } else {
                  document.exitFullscreen();
                  setIsFullscreen(false);
                }
              }}
            >
              {isFullscreen ? (
                <Minimize className="h-5 w-5" />
              ) : (
                <Maximize className="h-5 w-5" />
              )}
            </Button>

            {/* Split Orientation Toggle */}
            {(showTree || showGraph) && (
              <Button
                size="icon"
                variant="secondary"
                className="h-12 w-12 rounded-full shadow-lg hover:shadow-xl glass hover-lift ripple"
                onClick={() => setSplitOrientation(prev => prev === 'horizontal' ? 'vertical' : 'horizontal')}
              >
                <RotateCw className="h-5 w-5" />
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;
