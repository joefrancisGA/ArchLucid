"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { useCallback, useEffect, useRef, useState, type SetStateAction } from "react";
import { usePathname } from "next/navigation";

import { commitHrefIfChanged, readWindowLocationSearch } from "@/lib/navigation/replace-if-href-changed";

import { CopyIdButton } from "@/components/CopyIdButton";
import { runCollateralSealedManifestCopyBlockedReason } from "@/lib/runs/run-collateral-sealed-manifest-guard";
import { ShareLinkPermissionClarityPanel } from "@/components/usability/ShareLinkPermissionClarityPanel";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  parseReviewShareLinkOpenFromSearch,
  reviewShareLinkPanelsHrefFromSearch,
} from "@/lib/reviews/review-share-link-panels-url";

type ShareableReviewLinkButtonProps = {
  readonly runId: string;
  readonly isCommitted: boolean;
  readonly manifestVersion?: string | null;
};

/** Copy a read-only showcase link for sponsors who will not log in. */
export function ShareableReviewLinkButton(props: ShareableReviewLinkButtonProps) {
  const pathname = usePathname() ?? `/architecture/reviews/${props.runId}`;
  const [open, setOpenState] = useState(() =>
    parseReviewShareLinkOpenFromSearch(
      typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("shareLinkOpen"),
    ),
  );
  const openRef = useRef(open);
  openRef.current = open;

  const syncShareLinkOpenToUrl = useCallback(
    (nextOpen: boolean) => {
      commitHrefIfChanged(
        reviewShareLinkPanelsHrefFromSearch(readWindowLocationSearch(), nextOpen, pathname),
        { notify: false },
      );
    },
    [pathname],
  );

  const setOpen = useCallback(
    (value: SetStateAction<boolean>) => {
      setOpenState((current) => {
        const next = typeof value === "function" ? value(current) : value;

        if (openRef.current === next) {
          return current;
        }

        openRef.current = next;
        syncShareLinkOpenToUrl(next);

        return next;
      });
    },
    [syncShareLinkOpenToUrl],
  );

  useEffect(() => {
    const syncShareLinkOpenFromUrl = (): void => {
      const next = parseReviewShareLinkOpenFromSearch(
        new URLSearchParams(window.location.search).get("shareLinkOpen"),
      );

      if (openRef.current === next) {
        return;
      }

      openRef.current = next;
      setOpenState(next);
    };

    syncShareLinkOpenFromUrl();
    window.addEventListener("popstate", syncShareLinkOpenFromUrl);

    return () => {
      window.removeEventListener("popstate", syncShareLinkOpenFromUrl);
    };
  }, []);

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

  const sealedManifestBlockedReason = runCollateralSealedManifestCopyBlockedReason({
    runId: props.runId,
    manifestVersion: props.manifestVersion ?? null,
  });

  if (sealedManifestBlockedReason !== null) {
    return (
      <p
        role="alert"
        className={cn("m-0 text-rose-700 dark:text-rose-300", OPERATOR_TYPOGRAPHY.helper)}
        data-testid="shareable-review-link-blocked-reason"
      >
        {sealedManifestBlockedReason}
      </p>
    );
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
          <DialogTitle>Share review</DialogTitle>
          <DialogDescription>
            Send this read-only showcase link to sponsors who do not need architect access. Review who can open,
            expiry, export, and invite differences below before you copy the URL.
          </DialogDescription>
        </DialogHeader>
        <ShareLinkPermissionClarityPanel />
        <div className="flex flex-wrap items-center gap-2">
          <code
            className={cn(
              "flex-1 break-all rounded bg-neutral-100 px-2 py-1 dark:bg-neutral-800",
              OPERATOR_TYPOGRAPHY.helper,
            )}
          >
            {url}
          </code>
          <CopyIdButton value={url} aria-label="Copy share link" />
        </div>
      </DialogContent>
    </Dialog>
  );
}