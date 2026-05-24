import { lazy, Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Loader2 } from 'lucide-react';

// Lazy-load page components to split heavy Monaco editor chunk from primary bundle
const Home = lazy(() => import('./pages/Home'));
const Editor = lazy(() => import('./pages/Editor'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Premium loading fallback styled to match high-end aesthetics
const PageLoader = () => (
  <div className="flex h-screen flex-col items-center justify-center bg-background text-foreground animate-in fade-in duration-300">
    <div className="flex flex-col items-center gap-3">
      <Loader2 className="h-8 w-8 animate-spin text-accent" />
      <span className="text-[10px] font-semibold text-muted-foreground tracking-widest uppercase">
        Loading Workspace...
      </span>
    </div>
  </div>
);

const App = () => (
  <TooltipProvider>
    <Toaster />
    <Sonner />
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/editor/:id" element={<Editor />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  </TooltipProvider>
);

export default App;

