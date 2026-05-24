import { useEffect, useRef, useCallback, useState } from 'react';
import type { WorkerRequest, WorkerResponse } from '@/workers/jsonWorker';

export function useJsonWorker() {
  const workerRef = useRef<Worker | null>(null);
  const callbackRef = useRef<((result: any, error?: string) => void) | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const terminateAndReset = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    setIsProcessing(false);
    callbackRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  const runTask = useCallback(
    (request: WorkerRequest, callback: (result: any, error?: string) => void) => {
      // Terminate any active worker to cancel the ongoing heavy background computation instantly
      if (workerRef.current) {
        workerRef.current.terminate();
      }

      setIsProcessing(true);
      callbackRef.current = callback;

      // Spawn a fresh new worker for the latest task
      const worker = new Worker(
        new URL('../workers/jsonWorker.ts', import.meta.url),
        { type: 'module' }
      );
      workerRef.current = worker;

      worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
        const { result, error } = e.data;
        if (callbackRef.current) {
          callbackRef.current(result, error);
        }
        setIsProcessing(false);
      };

      worker.onerror = (err) => {
        if (callbackRef.current) {
          callbackRef.current(null, err.message || 'Worker error');
        }
        setIsProcessing(false);
      };

      worker.postMessage(request);
    },
    []
  );

  return { runTask, isProcessing, cancel: terminateAndReset };
}

