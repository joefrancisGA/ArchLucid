"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { useState, type ReactElement } from "react";

import { Button } from "@/components/ui/button";
import { BUYER_COPY_REVIEW_RECORD_JSON } from "@/lib/buyer/buyer-polish-copy";
import { useProductionDeskChrome } from "@/hooks/useProductionDeskChrome";
import type { CareerArtifactHonestyInput } from "@/lib/career-artifact/career-artifact-honesty";
import { fetchManifestJsonText } from "@/lib/manifest-json-fetch";
import { signedReviewRecordBlockedReason } from "@/lib/manifest/signed-review-record-blocked-reason";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { buildSealedManifestExportJson } from "@/lib/sealed-manifest-json-export";

import { runCollateralSealedManifestCopyBlockedReason } from "@/lib/runs/run-collateral-sealed-manifest-guard";

type CopyManifestButtonProps = {
  readonly runId: string;
  readonly manifestVersion?: string | null;
  readonly className?: string;
  readonly buyerPolishedLayout?: boolean;
  readonly careerArtifactHonesty?: Omit<CareerArtifactHonestyInput, "artifactKind" | "runId" | "workingDesk">;
};

/** One-click copy of the committed golden manifest JSON to the clipboard. */
export function CopyManifestButton(props: CopyManifestButtonProps): ReactElement {
  const { runId, manifestVersion, className, buyerPolishedLayout, careerArtifactHonesty } = props;
  const workingDesk = useProductionDeskChrome();
  const sealedManifestBlockedReason = runCollateralSealedManifestCopyBlockedReason({
    runId,
    manifestVersion,
  });
  const [copying, setCopying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onCopy = async (): Promise<void> => {
    const blockedReason = runCollateralSealedManifestCopyBlockedReason({ runId, manifestVersion });

    if (blockedReason !== null) {
      setError(blockedReason);
      return;
    }

    setCopying(true);
    setError(null);

    try {
      const jsonText = await fetchManifestJsonText(runId);
      const exportResult = buildSealedManifestExportJson({
        rawManifestJson: jsonText,
        runId,
        workingDesk,
        careerArtifactHonesty,
      });

      if (!exportResult.ok) {
        setError(exportResult.blockedReason);
        return;
      }

      await navigator.clipboard.writeText(exportResult.jsonText);
      setCopied(true);
      window.setTimeout(() => {
        setCopied(false);
      }, 2_000);
    } catch (copyError) {
      const failure = toApiLoadFailure(copyError);
      const blockedReason = signedReviewRecordBlockedReason(failure);
      const message =
        blockedReason ??
        (copyError instanceof Error
          ? copyError.message
          : "Could not copy review record JSON — check connectivity and try again.");
      setError(message);
    } finally {
      setCopying(false);
    }
  };

  return (
    <div className={className ?? "space-y-2"}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        data-testid="copy-manifest-json-button"
        disabled={copying || sealedManifestBlockedReason !== null}
        className="border-neutral-300 dark:border-neutral-600"
        onClick={() => void onCopy()}
      >
        {copying ? "Preparing JSON…" : copied ? "Copied!" : buyerPolishedLayout === true ? BUYER_COPY_REVIEW_RECORD_JSON : "Copy review record JSON"}
      </Button>
      {sealedManifestBlockedReason !== null ? (
        <p
          role="alert"
          className={cn("m-0 text-rose-700 dark:text-rose-300", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="copy-manifest-json-blocked-reason"
        >
          {sealedManifestBlockedReason}
        </p>
      ) : null}
      {error !== null ? (
        <p
          role="alert"
          className={cn("m-0 rounded-md border border-rose-600/40 bg-al-surface-raised px-3 py-2 text-al-text-primary dark:border-rose-700/50", OPERATOR_TYPOGRAPHY.body)}
          data-testid="copy-manifest-json-error"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
