import { useState } from 'react';
import { CheckCircle2, XCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { validateJsonSchema, ValidationResult } from '@/lib/jsonUtils';

interface SchemaValidatorProps {
  json: string;
  isJsonValid: boolean;
}

export function SchemaValidator({ json, isJsonValid }: SchemaValidatorProps) {
  const [schema, setSchema] = useState('');
  const [result, setResult] = useState<ValidationResult | null>(null);

  const handleValidate = () => {
    if (!schema.trim() || !json.trim()) return;
    const validationResult = validateJsonSchema(json, schema);
    setResult(validationResult);
  };

  const exampleSchema = `{
  "type": "object",
  "required": ["name", "age"],
  "properties": {
    "name": { "type": "string" },
    "age": { "type": "number" }
  }
}`;

  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">JSON Schema Validation</h3>
        <Button
          variant="link"
          size="sm"
          className="h-auto p-0 text-xs"
          onClick={() => setSchema(exampleSchema)}
        >
          Load example
        </Button>
      </div>

      <div className="flex items-start gap-2 rounded-md bg-muted/50 p-2 text-xs text-muted-foreground">
        <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
        <p>
          Enter a JSON Schema to validate your JSON against. Supports basic type checking, 
          required properties, and nested validation.
        </p>
      </div>

      <Textarea
        value={schema}
        onChange={(e) => {
          setSchema(e.target.value);
          setResult(null);
        }}
        placeholder="Paste your JSON Schema here..."
        className="min-h-[120px] font-mono text-sm"
      />

      <div className="flex items-center gap-3">
        <Button
          onClick={handleValidate}
          disabled={!schema.trim() || !isJsonValid}
          size="sm"
        >
          Validate Against Schema
        </Button>

        {result && (
          <div className="flex items-center gap-1.5">
            {result.valid ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-accent" />
                <span className="text-sm text-accent">Schema valid!</span>
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 text-destructive" />
                <span className="text-sm text-destructive">Schema invalid</span>
              </>
            )}
          </div>
        )}
      </div>

      {result && !result.valid && result.error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          <pre className="whitespace-pre-wrap font-mono text-xs">
            {result.error.message}
          </pre>
        </div>
      )}
    </div>
  );
}
