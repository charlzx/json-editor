import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Trash2,
  FileJson,
  Clock,
  FolderOpen,
  ChevronRight,
  Braces,
  Layers,
  CheckCircle2,
  XCircle,
  TreePine,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/jsonify/ThemeToggle';
import { useTheme } from '@/hooks/useTheme';
import { useProjects, Project } from '@/hooks/useProjects';
import { formatFileSize } from '@/lib/fileUtils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const s = Math.floor(diff / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(ts).toLocaleDateString();
}

const TEMPLATES = [
  { label: 'Empty object', value: '{}', icon: Braces },
  { label: 'Empty array', value: '[]', icon: Layers },
  {
    label: 'Sample user',
    icon: FileJson,
    value: JSON.stringify(
      {
        id: 1,
        name: 'Jane Doe',
        email: 'jane@example.com',
        roles: ['admin', 'editor'],
        active: true,
        meta: { createdAt: new Date().toISOString() },
      },
      null,
      2
    ),
  },
];

interface CreateDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (json?: string) => void;
}

function CreateDialog({ open, onClose, onCreate }: CreateDialogProps) {
  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">New Project</DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            Start with a template or an empty canvas.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2 pt-2">
          {TEMPLATES.map(t => (
            <button
              key={t.label}
              onClick={() => onCreate(t.value)}
              className="flex items-center gap-3 rounded-lg border border-border bg-background px-4 py-3 text-left text-sm font-medium hover:border-foreground/30 hover:bg-muted/40 transition-all duration-150 group"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted group-hover:bg-accent/10 transition-colors">
                <t.icon className="h-4 w-4 text-muted-foreground group-hover:text-accent transition-colors" />
              </span>
              <span>{t.label}</span>
              <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          ))}
          <button
            onClick={() => onCreate(undefined)}
            className="flex items-center gap-3 rounded-lg border border-dashed border-border bg-background px-4 py-3 text-left text-sm font-medium text-muted-foreground hover:border-foreground/30 hover:text-foreground hover:bg-muted/40 transition-all duration-150 group"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
              <Plus className="h-4 w-4" />
            </span>
            Blank project
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface ProjectCardProps {
  project: Project;
  onOpen: () => void;
  onDelete: () => void;
  index: number;
}

function ProjectCard({ project, onOpen, onDelete, index }: ProjectCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const preview = useMemo(() => {
    if (!project.json.trim()) return null;
    try {
      const parsed = JSON.parse(project.json);
      const keys = typeof parsed === 'object' && parsed !== null ? Object.keys(parsed) : [];
      return keys.slice(0, 4).join(', ') + (keys.length > 4 ? ', …' : '');
    } catch {
      return null;
    }
  }, [project.json]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay: index * 0.04 }}
      className="group relative flex flex-col rounded-xl border border-border bg-card card-hover overflow-hidden cursor-pointer"
      onClick={onOpen}
    >
      {/* Top colour strip */}
      <div className="h-0.5 w-full bg-gradient-to-r from-accent/60 via-accent/30 to-transparent" />

      <div className="flex flex-col gap-3 p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
              <FileJson className="h-4 w-4 text-muted-foreground" />
            </span>
            <div className="min-w-0">
              <p className="truncate font-semibold text-foreground text-sm leading-tight">
                {project.name}
              </p>
              {project.description && (
                <p className="truncate text-xs text-muted-foreground mt-0.5">
                  {project.description}
                </p>
              )}
            </div>
          </div>

          {/* Delete button — stops propagation */}
          <div onClick={e => e.stopPropagation()}>
            {confirmDelete ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onDelete()}
                  className="text-xs font-medium text-destructive hover:underline"
                >
                  Confirm
                </button>
                <span className="text-muted-foreground text-xs">/</span>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="text-xs text-muted-foreground hover:underline"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-destructive/10 hover:text-destructive text-muted-foreground"
                aria-label="Delete project"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* JSON preview */}
        {preview && (
          <p className="text-xs text-muted-foreground font-mono truncate leading-relaxed">
            {preview}
          </p>
        )}
        {!project.json.trim() && (
          <p className="text-xs text-muted-foreground italic">Empty project</p>
        )}

        {/* Footer chips */}
        <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-border/50">
          {/* Valid / invalid */}
          {project.json.trim() ? (
            project.isValid ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 border border-green-500/20 px-2 py-0.5 text-xs font-medium text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-3 w-3" />
                Valid
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 border border-red-500/20 px-2 py-0.5 text-xs font-medium text-red-600 dark:text-red-400">
                <XCircle className="h-3 w-3" />
                Invalid
              </span>
            )
          ) : null}

          {/* Size */}
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {formatFileSize(project.size)}
          </span>

          {/* Time */}
          <span className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {relativeTime(project.updatedAt)}
          </span>
        </div>
      </div>

      {/* Open arrow — visible on hover */}
      <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>
    </motion.div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const { projects, createProject, deleteProject } = useProjects();
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return projects;
    return projects.filter(
      p =>
        p.name.toLowerCase().includes(q) ||
        (p.description ?? '').toLowerCase().includes(q)
    );
  }, [projects, search]);

  const handleCreate = (json?: string) => {
    const id = createProject({ json: json ?? '' });
    setShowCreate(false);
    navigate(`/editor/${id}`);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── Navbar ── */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-foreground">
              <TreePine className="h-5 w-5 text-background" />
            </div>
            <span className="text-base font-semibold tracking-tight">JSON Tree</span>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
            <Button
              size="sm"
              className="gap-1.5 font-medium"
              onClick={() => setShowCreate(true)}
              id="new-project-btn"
            >
              <Plus className="h-4 w-4" />
              New Project
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-10"
        >
          <div className="flex items-end gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Browse and manage your JSON projects. All data is stored locally.
              </p>
            </div>
            {projects.length > 0 && (
              <span className="mb-0.5 rounded-full bg-muted px-2.5 py-0.5 text-sm font-medium text-muted-foreground">
                {projects.length}
              </span>
            )}
          </div>
        </motion.div>

        {/* Search bar */}
        {projects.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <input
                id="project-search"
                type="text"
                placeholder="Search projects..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full rounded-lg border border-border bg-muted/40 pl-9 pr-4 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/60 transition-all"
              />
            </div>
          </motion.div>
        )}

        {/* Grid or empty state */}
        <AnimatePresence mode="wait">
          {projects.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col items-center justify-center py-32 text-center"
            >
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-dashed border-border">
                <FolderOpen className="h-9 w-9 text-muted-foreground/60" />
              </div>
              <h2 className="text-xl font-semibold">No projects yet</h2>
              <p className="mt-2 max-w-xs text-sm text-muted-foreground">
                Create your first project to start editing and visualising JSON.
              </p>
              <Button
                className="mt-8 gap-2 font-medium"
                size="lg"
                onClick={() => setShowCreate(true)}
              >
                <Plus className="h-4 w-4" />
                Create your first project
              </Button>
            </motion.div>
          ) : filtered.length === 0 ? (
            <motion.div
              key="no-results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-20 text-center text-muted-foreground text-sm"
            >
              No projects match &ldquo;{search}&rdquo;
            </motion.div>
          ) : (
            <motion.div
              key="grid"
              layout
              className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              {filtered.map((project, i) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  index={i}
                  onOpen={() => navigate(`/editor/${project.id}`)}
                  onDelete={() => deleteProject(project.id)}
                />
              ))}

              {/* Add new card */}
              <motion.button
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, delay: filtered.length * 0.04 }}
                onClick={() => setShowCreate(true)}
                className="group flex min-h-[180px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card/40 text-muted-foreground hover:border-foreground/30 hover:text-foreground hover:bg-muted/30 transition-all duration-150"
                id="add-project-card"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-dashed border-current">
                  <Plus className="h-5 w-5" />
                </span>
                <span className="text-sm font-medium">New Project</span>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <CreateDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreate={handleCreate}
      />
    </div>
  );
}
