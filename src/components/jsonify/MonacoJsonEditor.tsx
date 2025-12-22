import { useRef, useEffect } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import type * as Monaco from 'monaco-editor';

interface MonacoJsonEditorProps {
  value: string;
  onChange: (value: string) => void;
  errorLine?: number;
}

export function MonacoJsonEditor({ value, onChange, errorLine }: MonacoJsonEditorProps) {
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // Configure JSON language features
    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
      validate: true,
      allowComments: false,
      schemas: [],
      enableSchemaRequest: true,
    });

    // Add custom theme
    monaco.editor.defineTheme('json-tree-light', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'string.key.json', foreground: '5a7f6d' },
        { token: 'string.value.json', foreground: '4a8f67' },
        { token: 'number', foreground: 'd97706' },
        { token: 'keyword.json', foreground: 'b87d2c' },
      ],
      colors: {
        'editor.background': '#f5f1ed',
        'editor.lineHighlightBackground': '#ebe7e3',
        'editorLineNumber.foreground': '#9ca3af',
        'editorGutter.background': '#ebe7e3',
      },
    });

    monaco.editor.defineTheme('json-tree-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'string.key.json', foreground: 'c9a66b' },
        { token: 'string.value.json', foreground: '7fc99a' },
        { token: 'number', foreground: 'f59e0b' },
        { token: 'keyword.json', foreground: 'c9a66b' },
      ],
      colors: {
        'editor.background': '#0d0d0d',
        'editor.lineHighlightBackground': '#1f1f1f',
        'editorLineNumber.foreground': '#737373',
        'editorGutter.background': '#121212',
      },
    });

    // Determine theme based on document
    const isDark = document.documentElement.classList.contains('dark');
    monaco.editor.setTheme(isDark ? 'json-tree-dark' : 'json-tree-light');
  };

  // Update editor value when it changes externally
  useEffect(() => {
    if (editorRef.current && editorRef.current.getValue() !== value) {
      editorRef.current.setValue(value);
    }
  }, [value]);

  // Handle error highlighting
  useEffect(() => {
    if (editorRef.current && errorLine) {
      const editor = editorRef.current;
      const decorations = editor.deltaDecorations(
        [],
        [
          {
            range: new (window as any).monaco.Range(errorLine, 1, errorLine, 1),
            options: {
              isWholeLine: true,
              className: 'error-line',
              glyphMarginClassName: 'error-glyph',
              linesDecorationsClassName: 'error-line-decoration',
            },
          },
        ]
      );

      return () => {
        editor.deltaDecorations(decorations, []);
      };
    }
  }, [errorLine]);

  // Update theme when document class changes
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const isDark = document.documentElement.classList.contains('dark');
      if (editorRef.current) {
        (window as any).monaco?.editor.setTheme(isDark ? 'json-tree-dark' : 'json-tree-light');
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="h-full w-full rounded-lg overflow-hidden border border-border">
      <Editor
        height="100%"
        defaultLanguage="json"
        value={value}
        onChange={(value) => onChange(value || '')}
        onMount={handleEditorDidMount}
        options={{
          minimap: { enabled: true },
          scrollBeyondLastLine: false,
          fontSize: 14,
          fontFamily: 'JetBrains Mono, monospace',
          lineNumbers: 'on',
          renderWhitespace: 'selection',
          bracketPairColorization: { enabled: true },
          folding: true,
          foldingStrategy: 'indentation',
          showFoldingControls: 'mouseover',
          smoothScrolling: true,
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          formatOnPaste: true,
          formatOnType: true,
          autoClosingBrackets: 'always',
          autoClosingQuotes: 'always',
          suggest: {
            showKeywords: true,
          },
          quickSuggestions: {
            strings: true,
          },
          padding: { top: 16, bottom: 16 },
          scrollbar: {
            verticalScrollbarSize: 8,
            horizontalScrollbarSize: 8,
          },
        }}
      />
    </div>
  );
}
