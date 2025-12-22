import { useState, useEffect, useMemo, useCallback } from 'react';
import { TreePine } from 'lucide-react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { ThemeToggle } from '@/components/jsonify/ThemeToggle';
import { JsonEditor } from '@/components/jsonify/JsonEditor';
import { Toolbar } from '@/components/jsonify/Toolbar';
import { StatusBar } from '@/components/jsonify/StatusBar';
import { TreeView } from '@/components/jsonify/TreeView';
import { GraphView } from '@/components/jsonify/GraphView';
import { HistoryPanel } from '@/components/jsonify/HistoryPanel';
import { SchemaValidator } from '@/components/jsonify/SchemaValidator';
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

  const handleFormat = (indent: number) => {
    try {
      const formatted = formatJson(json, indent);
      setPreviousJson(json);
      setJson(formatted);
      addToHistory(formatted);
      toast.success('JSON formatted');
    } catch {
      toast.error('Failed to format JSON');
    }
  };

  const handleMinify = () => {
    try {
      const minified = minifyJson(json);
      setPreviousJson(json);
      setJson(minified);
      toast.success('JSON minified');
    } catch {
      toast.error('Failed to minify JSON');
    }
  };

  const handleUndo = () => {
    if (previousJson !== null) {
      setJson(previousJson);
      setPreviousJson(null);
      toast.success('Undone');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(json);
    toast.success('Copied to clipboard');
  };

  const handleClear = () => {
    setPreviousJson(json);
    setJson('');
    setShowTree(false);
    toast.success('Cleared');
  };

  const handleHistorySelect = (selectedJson: string) => {
    setJson(selectedJson);
    setShowHistory(false);
  };

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
        {showSchema && (
          <SchemaValidator json={json} isJsonValid={validation.valid} />
        )}

        {/* Editor area */}
        <div className="flex flex-1 gap-4 overflow-hidden">
          {/* Main editor + visualization */}
          <div className="flex flex-1 overflow-hidden">
            {(showTree || showGraph) && validation.valid && hasContent ? (
              <ResizablePanelGroup direction="horizontal" className="h-full">
                <ResizablePanel defaultSize={50} minSize={30}>
                  <JsonEditor
                    value={json}
                    onChange={setJson}
                    errorLine={validation.error?.line}
                  />
                </ResizablePanel>
                <ResizableHandle withHandle className="mx-2" />
                <ResizablePanel defaultSize={50} minSize={25}>
                  {showTree && (
                    <div className="h-full overflow-auto rounded-lg border border-border bg-card scrollbar-thin">
                      <TreeView nodes={treeNodes} />
                    </div>
                  )}
                  {showGraph && (
                    <GraphView nodes={treeNodes} />
                  )}
                </ResizablePanel>
              </ResizablePanelGroup>
            ) : (
              <div className="flex-1">
                <JsonEditor
                  value={json}
                  onChange={setJson}
                  errorLine={validation.error?.line}
                />
              </div>
            )}
          </div>

          {/* History panel */}
          {showHistory && (
            <HistoryPanel
              history={history}
              onSelect={handleHistorySelect}
              onRemove={removeFromHistory}
              onClear={clearHistory}
              onClose={() => setShowHistory(false)}
            />
          )}
        </div>

        {/* Status bar */}
        <StatusBar
          validation={validation}
          stats={stats}
          hasContent={hasContent}
        />
      </main>
    </div>
  );
};

export default Index;
