"use client";

import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import { WhyDisabledCtaHint } from "@/components/usability/WhyDisabledCtaHint";
import { getFirstValueReportMarkdown } from "@/lib/api";
import { runCollateralSealedManifestCopyBlockedReason } from "@/lib/runs/run-collateral-sealed-manifest-guard";
import { whyDisabledNeedsPrerequisite, whyDisabledPolicy } from "@/lib/why-disabled-cta";
import { showError, showSuccess } from "@/lib/toast";

export type ShareReviewPackageButtonProps = {
  readonly runId: string;
  readonly systemName: string;
  readonly committed: boolean;
  readonly manifestVersion?: string | null;
  readonly variant?: "default" | "outline" | "secondary";
  readonly size?: "default" | "sm";
};

/** Downloads the sponsor first-value Markdown report in one click. */
export function ShareReviewPackageButton(props: ShareReviewPackageButtonProps): React.JSX.Element {
  const { runId, systemName, committed, manifestVersion, variant = "outline", size = "sm" } = props;
  const [busy, setBusy] = useState(false);
  const sealedManifestBlockedReason = runCollateralSealedManifestCopyBlockedReason({
    runId,
    manifestVersion,
  });
  const shareDisabledReason = sealedManifestBlockedReason !== null
    ? whyDisabledPolicy(sealedManifestBlockedReason)
    : (committed ? null : whyDisabledNeedsPrerequisite("a finalized review"));
  const shareDisabledHintId = "share-review-package-disabled-hint";

  const onShare = useCallback(async () => {
    setBusy(true);

    try {
      const markdown = await getFirstValueReportMarkdown(runId);

      if (markdown === null || markdown.trim().length === 0) {
        showError("Share review", "Finalize the review before generating the sponsor report.");

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

      showError("Share review", message);
    } finally {
      setBusy(false);
    }
  }, [runId, systemName]);

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <Button
        type="button"
        variant={variant}
        size={size}
        disabled={shareDisabledReason !== null || busy}
        aria-describedby={shareDisabledReason === null ? undefined : shareDisabledHintId}
        data-testid="share-review-package-button"
        onClick={() => void onShare()}
      >
        {busy ? "Preparing…" : "Share review"}
      </Button>
      <WhyDisabledCtaHint
        id={shareDisabledHintId}
        reason={shareDisabledReason}
        testId={shareDisabledHintId}
      />
    </div>
  );
}
