import { useMemo } from 'react';

interface SyntaxHighlighterProps {
  json: string;
}

export function SyntaxHighlighter({ json }: SyntaxHighlighterProps) {
  const highlighted = useMemo(() => {
    try {
      const parsed = JSON.parse(json);
      return highlightJson(parsed, 0);
    } catch {
      return <span className="text-foreground">{json}</span>;
    }
  }, [json]);

  return (
    <pre className="font-mono text-sm leading-6 whitespace-pre-wrap break-all">
      {highlighted}
    </pre>
  );
}

function highlightJson(value: unknown, indent: number): React.ReactNode {
  const spaces = '  '.repeat(indent);

  if (value === null) {
    return <span className="syntax-null">null</span>;
  }

  if (typeof value === 'boolean') {
    return <span className="syntax-boolean">{String(value)}</span>;
  }

  if (typeof value === 'number') {
    return <span className="syntax-number">{value}</span>;
  }

  if (typeof value === 'string') {
    return <span className="syntax-string">"{escapeString(value)}"</span>;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return (
        <>
          <span className="syntax-bracket">[</span>
          <span className="syntax-bracket">]</span>
        </>
      );
    }

    return (
      <>
        <span className="syntax-bracket">[</span>
        {'\n'}
        {value.map((item, index) => (
          <span key={index}>
            {spaces}  {highlightJson(item, indent + 1)}
            {index < value.length - 1 ? ',' : ''}
            {'\n'}
          </span>
        ))}
        {spaces}<span className="syntax-bracket">]</span>
      </>
    );
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value);
    if (entries.length === 0) {
      return (
        <>
          <span className="syntax-bracket">{'{'}</span>
          <span className="syntax-bracket">{'}'}</span>
        </>
      );
    }

    return (
      <>
        <span className="syntax-bracket">{'{'}</span>
        {'\n'}
        {entries.map(([key, val], index) => (
          <span key={key}>
            {spaces}  <span className="syntax-key">"{key}"</span>: {highlightJson(val, indent + 1)}
            {index < entries.length - 1 ? ',' : ''}
            {'\n'}
          </span>
        ))}
        {spaces}<span className="syntax-bracket">{'}'}</span>
      </>
    );
  }

  return String(value);
}

function escapeString(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}
