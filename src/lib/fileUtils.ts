/**
 * Utility functions for handling large file operations
 */

const CHUNK_SIZE = 64 * 1024; // 64KB chunks

/**
 * Read a file in chunks with progress callback
 */
export async function readFileInChunks(
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    let result = '';
    let offset = 0;

    const readNextChunk = () => {
      const slice = file.slice(offset, offset + CHUNK_SIZE);
      reader.readAsText(slice);
    };

    reader.onload = (e) => {
      if (e.target?.result) {
        result += e.target.result as string;
        offset += CHUNK_SIZE;

        if (onProgress) {
          const progress = Math.min((offset / file.size) * 100, 100);
          onProgress(progress);
        }

        if (offset < file.size) {
          readNextChunk();
        } else {
          resolve(result);
        }
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    readNextChunk();
  });
}

/**
 * Validate JSON incrementally to detect errors early
 */
export function validateJsonIncremental(json: string): {
  valid: boolean;
  error?: string;
  position?: number;
} {
  try {
    JSON.parse(json);
    return { valid: true };
  } catch (e) {
    const error = e as SyntaxError;
    const match = error.message.match(/at position (\d+)/);
    const position = match ? parseInt(match[1], 10) : undefined;
    
    return {
      valid: false,
      error: error.message,
      position,
    };
  }
}

/**
 * Check if a string is likely valid JSON without parsing
 */
export function isLikelyJSON(str: string): boolean {
  const trimmed = str.trim();
  if (trimmed.length === 0) return false;
  
  const firstChar = trimmed[0];
  const lastChar = trimmed[trimmed.length - 1];
  
  // Check for object or array structure
  return (
    (firstChar === '{' && lastChar === '}') ||
    (firstChar === '[' && lastChar === ']')
  );
}

/**
 * Get file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}
