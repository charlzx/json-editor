import { useState } from 'react';
import { Copy, Check, Share2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  json: string;
}

export function ShareDialog({ open, onOpenChange, json }: ShareDialogProps) {
  const [copied, setCopied] = useState(false);

  // For now, use URL encoding (will be replaced with short URLs later)
  const encodedJson = encodeURIComponent(json);
  const shareUrl = `${window.location.origin}?json=${encodedJson}`;
  const isTooLong = shareUrl.length > 2000;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary" />
            Share JSON
          </DialogTitle>
          <DialogDescription>
            Copy the link below to share your JSON with others.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isTooLong ? (
            <div className="flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm">
              <AlertTriangle className="h-5 w-5 flex-shrink-0 text-destructive" />
              <div>
                <p className="font-medium text-destructive">JSON too large</p>
                <p className="text-muted-foreground">
                  The URL is too long ({(shareUrl.length / 1000).toFixed(1)}KB). 
                  Short URL generation coming soon!
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={shareUrl}
                  className="font-mono text-xs"
                />
                <Button size="icon" onClick={handleCopy}>
                  {copied ? (
                    <Check className="h-4 w-4 text-accent" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                URL length: {(shareUrl.length / 1000).toFixed(1)}KB
              </p>
            </>
          )}

          <div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
            <p>
              <strong>Coming soon:</strong> Short URLs with permanent storage. 
              Connect a backend to enable this feature.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
