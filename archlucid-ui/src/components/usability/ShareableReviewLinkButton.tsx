"use client";

import { useCallback, useState } from "react";

import { CopyIdButton } from "@/components/CopyIdButton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type ShareableReviewLinkButtonProps = {
  readonly runId: string;
  readonly isCommitted: boolean;
};

/** Copy a read-only showcase link for sponsors who will not log in. */
export function ShareableReviewLinkButton(props: ShareableReviewLinkButtonProps) {
  const [open, setOpen] = useState(false);

  const shareUrl = useCallback((): string => {
    if (typeof window === "undefined") {
      return `/showcase/${encodeURIComponent(props.runId)}`;
    }

    const origin = window.location.origin;

    return `${origin}/showcase/${encodeURIComponent(props.runId)}`;
  }, [props.runId]);

  if (!props.isCommitted) {
    return null;
  }

  const url = shareUrl();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm" data-testid="shareable-review-link-trigger">
          Share read-only link
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Share review package</DialogTitle>
          <DialogDescription>
            Send this read-only link to sponsors who do not need operator access. Scope and retention follow your tenant policy.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-wrap items-center gap-2">
          <code className="flex-1 break-all rounded bg-neutral-100 px-2 py-1 text-xs dark:bg-neutral-800">{url}</code>
          <CopyIdButton value={url} aria-label="Copy share link" />
        </div>
      </DialogContent>
    </Dialog>
  );
}
