# json-editor

A modern, browser-based JSON editor built specifically for creating, editing, and visualizing professional JSON structures. Features a split-pane interface with a code editor, live tree/graph preview, schema validation, and full project management — all running locally in your browser.

**Live Demo:** [json.charlz.dev](https://json.charlz.dev)

---

## Key Features

- **Split-Pane Workspace:** Monaco editor (powering VS Code) on the left, with dynamic resizable layout panels.
- **Visual Graph Renderer:** Interactive node graph rendering with a dotted infinite pattern canvas and highlight ancestor path tracing.
- **Hierarchical Tree View:** Real-time tree view with reactive expand and collapse toggle states.
- **Indentation & Minification:** Single-click formatting (2 spaces, 4 spaces, tabs) or minification triggers.
- **Local Sandbox Storage:** Multi-project management persisting 100% locally in your browser's local storage.
- **Schema Validation:** Custom schema verification with real-time error logging in the editor's status bar.
- **Import & Export:** Drag-and-drop or select local `.json` files to open, and export formatted outputs.
- **Theme Modes:** Fully integrated dark and light modes with saved state preferences.

---

## Tech Stack

- **Framework:** React 18 + TypeScript + Vite 6
- **Editor:** Monaco Editor (`@monaco-editor/react`)
- **Layout:** `react-resizable-panels`
- **Styling:** Tailwind CSS 3 (with custom dark-theme tokens)
- **Animations:** Framer Motion
- **Icons:** Lucide React

---

## Getting Started

### Prerequisites

- Node.js >= 18
- pnpm (recommended)

### Setup

```bash
# Clone the repository
git clone https://github.com/charlzx/json-editor.git
cd json-editor

# Install dependencies
pnpm install

# Start local dev server
pnpm dev

# Build production assets
pnpm build
```

---

Built by [Charlz](https://charlz.dev)
