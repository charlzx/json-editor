// Web Worker for processing JSON off the main thread
import { validateJson, formatJson, minifyJson, getJsonStats, buildTree } from '@/lib/jsonUtils';

export interface WorkerRequest {
  type: 'validate' | 'format' | 'minify' | 'stats' | 'buildTree';
  payload: any;
}

export interface WorkerResponse {
  type: 'validate' | 'format' | 'minify' | 'stats' | 'buildTree';
  result: any;
  error?: string;
}

self.onmessage = (e: MessageEvent<WorkerRequest>) => {
  const { type, payload } = e.data;

  try {
    let result: any;

    switch (type) {
      case 'validate':
        result = validateJson(payload);
        break;
      case 'format':
        result = formatJson(payload);
        break;
      case 'minify':
        result = minifyJson(payload);
        break;
      case 'stats':
        result = getJsonStats(payload.json, payload.parsed);
        break;
      case 'buildTree':
        result = buildTree(payload);
        break;
      default:
        throw new Error(`Unknown worker request type: ${type}`);
    }

    const response: WorkerResponse = { type, result };
    self.postMessage(response);
  } catch (error) {
    const response: WorkerResponse = {
      type,
      result: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    self.postMessage(response);
  }
};
