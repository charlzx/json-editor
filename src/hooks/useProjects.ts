import { useState, useEffect, useCallback } from 'react';
import { validateJson } from '@/lib/jsonUtils';

export interface ProjectVersion {
  id: string;
  timestamp: number;
  name: string;
  json: string;
  size: number;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  json: string;
  createdAt: number;
  updatedAt: number;
  size: number;
  isValid: boolean;
  versions?: ProjectVersion[];
}

const STORAGE_KEY = 'jsonify-projects';

function loadFromStorage(): Project[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Project[];
  } catch {
    return [];
  }
}

function saveToStorage(projects: Project[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function getAutoName(existing: Project[]): string {
  const untitled = existing.filter(p => p.name.startsWith('Untitled'));
  if (untitled.length === 0) return 'Untitled 1';
  const numbers = untitled
    .map(p => {
      const match = p.name.match(/^Untitled\s*(\d+)$/);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter(n => n > 0);
  const max = numbers.length > 0 ? Math.max(...numbers) : 0;
  return `Untitled ${max + 1}`;
}

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>(loadFromStorage);

  // Sync across tabs
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setProjects(loadFromStorage());
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const createProject = useCallback(
    (overrides?: Partial<Pick<Project, 'name' | 'description' | 'json'>>): string => {
      const now = Date.now();
      const id = generateId();
      setProjects(prev => {
        const name = overrides?.name ?? getAutoName(prev);
        const json = overrides?.json ?? '';
        const { valid } = validateJson(json);
        const newProject: Project = {
          id,
          name,
          description: overrides?.description,
          json,
          createdAt: now,
          updatedAt: now,
          size: new Blob([json]).size,
          isValid: valid,
        };
        const updated = [newProject, ...prev];
        saveToStorage(updated);
        return updated;
      });
      return id;
    },
    []
  );

  const updateProject = useCallback(
    (id: string, patch: Partial<Omit<Project, 'id' | 'createdAt'>>) => {
      setProjects(prev => {
        const updated = prev.map(p => {
          if (p.id !== id) return p;
          const merged = { ...p, ...patch, updatedAt: Date.now() };
          // Recompute size + validity if json changed
          if (patch.json !== undefined) {
            merged.size = new Blob([patch.json]).size;
            merged.isValid = validateJson(patch.json).valid;
          }
          return merged;
        });
        saveToStorage(updated);
        return updated;
      });
    },
    []
  );

  const deleteProject = useCallback((id: string) => {
    setProjects(prev => {
      const updated = prev.filter(p => p.id !== id);
      saveToStorage(updated);
      return updated;
    });
  }, []);

  const getProject = useCallback(
    (id: string): Project | undefined => {
      return loadFromStorage().find(p => p.id === id);
    },
    []
  );

  const createCheckpoint = useCallback((projectId: string, name: string) => {
    setProjects(prev => {
      const updated = prev.map(p => {
        if (p.id !== projectId) return p;
        const now = Date.now();
        const newVersion: ProjectVersion = {
          id: `v-${now}-${Math.random().toString(36).slice(2, 9)}`,
          timestamp: now,
          name: name.trim() || `Backup ${new Date(now).toLocaleTimeString()}`,
          json: p.json,
          size: p.size,
        };
        const currentVersions = p.versions || [];
        const nextVersions = [newVersion, ...currentVersions].slice(0, 15);
        return {
          ...p,
          versions: nextVersions,
          updatedAt: now,
        };
      });
      saveToStorage(updated);
      return updated;
    });
  }, []);

  const deleteCheckpoint = useCallback((projectId: string, versionId: string) => {
    setProjects(prev => {
      const updated = prev.map(p => {
        if (p.id !== projectId) return p;
        const currentVersions = p.versions || [];
        const nextVersions = currentVersions.filter(v => v.id !== versionId);
        return {
          ...p,
          versions: nextVersions,
          updatedAt: Date.now(),
        };
      });
      saveToStorage(updated);
      return updated;
    });
  }, []);

  const restoreCheckpoint = useCallback((projectId: string, version: ProjectVersion) => {
    setProjects(prev => {
      const updated = prev.map(p => {
        if (p.id !== projectId) return p;
        const now = Date.now();
        const backupVersion: ProjectVersion = {
          id: `v-${now}-${Math.random().toString(36).slice(2, 9)}`,
          timestamp: now,
          name: `Pre-restore Auto-Backup`,
          json: p.json,
          size: p.size,
        };
        const currentVersions = p.versions || [];
        const nextVersions = [backupVersion, ...currentVersions].slice(0, 15);

        const { valid } = validateJson(version.json);
        return {
          ...p,
          json: version.json,
          size: version.size,
          isValid: valid,
          versions: nextVersions,
          updatedAt: now,
        };
      });
      saveToStorage(updated);
      return updated;
    });
  }, []);

  return {
    projects,
    createProject,
    updateProject,
    deleteProject,
    getProject,
    createCheckpoint,
    deleteCheckpoint,
    restoreCheckpoint,
  };
}
