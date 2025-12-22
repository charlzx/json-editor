import { useState, useEffect } from 'react';

export interface HistoryItem {
  id: string;
  json: string;
  timestamp: number;
  preview: string;
}

const MAX_HISTORY = 10;
const STORAGE_KEY = 'jsonify-history';

export function useJsonHistory() {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setHistory(JSON.parse(stored));
      } catch {
        setHistory([]);
      }
    }
  }, []);

  const addToHistory = (json: string) => {
    if (!json.trim()) return;
    
    const preview = json.slice(0, 50) + (json.length > 50 ? '...' : '');
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      json,
      timestamp: Date.now(),
      preview,
    };

    setHistory(prev => {
      const filtered = prev.filter(item => item.json !== json);
      const updated = [newItem, ...filtered].slice(0, MAX_HISTORY);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  const removeFromHistory = (id: string) => {
    setHistory(prev => {
      const updated = prev.filter(item => item.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  return { history, addToHistory, clearHistory, removeFromHistory };
}
