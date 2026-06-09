"use client";

import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import { getFirstValueReportMarkdown } from "@/lib/api";
import { showError, showSuccess } from "@/lib/toast";

export type ShareReviewPackageButtonProps = {
  readonly runId: string;
  readonly systemName: string;
  readonly committed: boolean;
  readonly variant?: "default" | "outline" | "secondary";
  readonly size?: "default" | "sm";
};

/** Downloads the sponsor first-value Markdown report in one click. */
export function ShareReviewPackageButton(props: ShareReviewPackageButtonProps): React.JSX.Element {
  const { runId, systemName, committed, variant = "outline", size = "sm" } = props;
  const [busy, setBusy] = useState(false);

  const onShare = useCallback(async () => {
    setBusy(true);

    try {
      const markdown = await getFirstValueReportMarkdown(runId);

      if (markdown === null || markdown.trim().length === 0) {
        showError("Share review package", "Finalize the review before generating the sponsor report.");

        return;
      }

      const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      const slug = systemName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

      anchor.href = url;
      anchor.download = `sponsor-${slug || runId}.md`;
      anchor.click();
      URL.revokeObjectURL(url);
      showSuccess("Sponsor report ready — download started.");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Could not generate report.";

      showError("Share review package", message);
    } finally {
      setBusy(false);
    }
  }, [runId, systemName]);

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      disabled={!committed || busy}
      title={committed ? undefined : "Finalize review first"}
      data-testid="share-review-package-button"
      onClick={() => void onShare()}
    >
      {busy ? "Preparing…" : "Share review package"}
    </Button>
  );
}
