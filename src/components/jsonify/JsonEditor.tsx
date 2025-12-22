import { useRef, useEffect, useCallback } from 'react';

interface JsonEditorProps {
  value: string;
  onChange: (value: string) => void;
  errorLine?: number;
}

export function JsonEditor({ value, onChange, errorLine }: JsonEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  const lines = value.split('\n');
  const lineCount = lines.length;

  const syncScroll = useCallback(() => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  }, []);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.addEventListener('scroll', syncScroll);
      return () => textarea.removeEventListener('scroll', syncScroll);
    }
  }, [syncScroll]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;
      const newValue = value.substring(0, start) + '  ' + value.substring(end);
      onChange(newValue);
      
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2;
        }
      }, 0);
    }
  };

  return (
    <div className="relative flex h-full w-full overflow-hidden rounded-lg border border-border bg-editor-bg">
      {/* Line numbers */}
      <div
        ref={lineNumbersRef}
        className="flex-shrink-0 overflow-hidden bg-editor-gutter py-3 pr-2 pl-3 select-none"
      >
        {Array.from({ length: lineCount }, (_, i) => (
          <div
            key={i + 1}
            className={`text-right font-mono text-sm leading-6 ${
              errorLine === i + 1
                ? 'text-destructive font-bold'
                : 'text-editor-line-number'
            }`}
          >
            {i + 1}
          </div>
        ))}
      </div>

      {/* Editor */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        spellCheck={false}
        className="flex-1 resize-none bg-transparent p-3 font-mono text-sm leading-6 text-foreground outline-none scrollbar-thin placeholder:text-muted-foreground"
        placeholder='Paste or type your JSON here...'
      />
    </div>
  );
}
