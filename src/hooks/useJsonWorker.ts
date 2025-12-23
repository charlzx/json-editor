import { useEffect, useRef, useCallback } from 'react';
import type { WorkerRequest, WorkerResponse } from '@/workers/jsonWorker';

export function useJsonWorker() {
  const workerRef = useRef<Worker | null>(null);
  const callbacksRef = useRef<Map<string, (result: any, error?: string) => void>>(new Map());

  useEffect(() => {
    // Create worker
    workerRef.current = new Worker(
      new URL('../workers/jsonWorker.ts', import.meta.url),
      { type: 'module' }
    );

    // Handle messages from worker
    workerRef.current.onmessage = (e: MessageEvent<WorkerResponse>) => {
      const { type, result, error } = e.data;
      const callback = callbacksRef.current.get(type);
      if (callback) {
        callback(result, error);
        callbacksRef.current.delete(type);
      }
    };

    // Cleanup
    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const postMessage = useCallback(
    (request: WorkerRequest, callback: (result: any, error?: string) => void) => {
      if (workerRef.current) {
        callbacksRef.current.set(request.type, callback);
        workerRef.current.postMessage(request);
      }
    },
    []
  );

  return { postMessage };
}
