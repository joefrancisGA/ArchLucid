"use client";

import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import { buildExecutiveSponsorLink } from "@/lib/build-executive-sponsor-link";
import { showError, showSuccess } from "@/lib/toast";

type CopyExecutiveSponsorLinkButtonProps = {
  readonly runId: string;
};

/** Copies a read-only sponsor report URL for executive handoff. */
export function CopyExecutiveSponsorLinkButton(props: CopyExecutiveSponsorLinkButtonProps): React.JSX.Element {
  const [copying, setCopying] = useState(false);

  const onCopy = useCallback(async () => {
    if (typeof window === "undefined") {
      return;
    }

    setCopying(true);

    try {
      const href = buildExecutiveSponsorLink(props.runId, window.location.origin);
      await navigator.clipboard.writeText(href);
      showSuccess("Executive link copied");
    } catch {
      showError("Could not copy link — try again or copy manually from the address bar after opening sponsor report.");
    } finally {
      setCopying(false);
    }
  }, [props.runId]);

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={copying}
      onClick={() => void onCopy()}
      data-testid="copy-executive-sponsor-link"
    >
      {copying ? "Copying…" : "Copy executive link"}
    </Button>
  );
}
