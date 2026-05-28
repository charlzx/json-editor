import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
    document.title = "JSON Editor - Page Not Found";
    
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute('content', "Page not found in JSON Editor application.");
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background text-foreground">
      <div className="text-center">
        <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground mb-3">404</p>
        <h1 className="text-4xl font-bold tracking-tight">Page not found</h1>
        <p className="mt-3 text-muted-foreground">The page you're looking for doesn't exist.</p>
      </div>
      <Button variant="outline" onClick={() => navigate('/')} className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        Back to projects
      </Button>
    </div>
  );
};

export default NotFound;
