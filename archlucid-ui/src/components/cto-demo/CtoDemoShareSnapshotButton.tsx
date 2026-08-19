"use client";

import { Share2 } from "lucide-react";
import { useCallback } from "react";

import { Button } from "@/components/ui/button";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import { showError, showSuccess } from "@/lib/toast";

export function CtoDemoShareSnapshotButton(): React.JSX.Element {
  const onShare = useCallback(async () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/showcase/${encodeURIComponent(SHOWCASE_STATIC_DEMO_RUN_ID)}`;

    try {
      await navigator.clipboard.writeText(url);

      if (origin.includes("localhost") || origin.includes("127.0.0.1")) {
        showSuccess("Link copied — localhost only in this session. Use hosted demo URL for sharing.");
      } else {
        showSuccess("Link copied — anyone with this link can view the showcase.");
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Clipboard unavailable.";

      showError("Share snapshot", message);
    }
  }, []);

  return (
    <Button type="button" size="sm" variant="outline" onClick={() => void onShare()} data-testid="cto-demo-share-snapshot">
      <Share2 className="mr-1 h-3.5 w-3.5" aria-hidden />
      Share read-only view
    </Button>
  );
}
