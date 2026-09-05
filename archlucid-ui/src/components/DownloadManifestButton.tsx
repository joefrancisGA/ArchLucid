"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { useState, type ReactElement } from "react";

import { Button } from "@/components/ui/button";
import { BUYER_DOWNLOAD_REVIEW_RECORD_JSON } from "@/lib/buyer/buyer-polish-copy";
import { fetchManifestJsonText, manifestJsonDownloadFileName } from "@/lib/manifest-json-fetch";
import { runCollateralSealedManifestCopyBlockedReason } from "@/lib/runs/run-collateral-sealed-manifest-guard";

type DownloadManifestButtonProps = {
  readonly runId: string;
  readonly manifestVersion?: string | null;
  readonly className?: string;
  readonly buyerPolishedLayout?: boolean;
};

/** One-click browser download of the committed finalized review record JSON for a review. */
export function DownloadManifestButton(props: DownloadManifestButtonProps): ReactElement {
  const { runId, manifestVersion, className, buyerPolishedLayout } = props;
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sealedManifestBlockedReason = runCollateralSealedManifestCopyBlockedReason({
    runId,
    manifestVersion,
  });

  const onDownload = async (): Promise<void> => {
    if (sealedManifestBlockedReason !== null) {
      setError(sealedManifestBlockedReason);
      return;
    }

    setDownloading(true);
    setError(null);

    try {
      const jsonText = await fetchManifestJsonText(runId);
      const blob = new Blob([jsonText], { type: "application/json" });
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = manifestJsonDownloadFileName(runId);
      anchor.click();
      URL.revokeObjectURL(objectUrl);
    } catch (downloadError) {
      const message =
        downloadError instanceof Error
          ? downloadError.message
          : "Could not download review record JSON — check connectivity and try again.";
      setError(message);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className={className ?? "space-y-2"}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        data-testid="download-manifest-json-button"
        disabled={downloading || sealedManifestBlockedReason !== null}
        className="border-neutral-300 dark:border-neutral-600"
        onClick={() => void onDownload()}
      >
        {downloading ? "Preparing JSON…" : buyerPolishedLayout === true ? BUYER_DOWNLOAD_REVIEW_RECORD_JSON : "Download review record (JSON)"}
      </Button>
      {sealedManifestBlockedReason !== null ? (
        <p
          role="alert"
          className={cn("m-0 text-rose-700 dark:text-rose-300", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="download-manifest-json-blocked-reason"
        >
          {sealedManifestBlockedReason}
        </p>
      ) : null}
      {error !== null ? (
        <p
          role="alert"
          className={cn("m-0 rounded-md border border-rose-600/40 bg-al-surface-raised px-3 py-2 text-al-text-primary dark:border-rose-700/50", OPERATOR_TYPOGRAPHY.body)}
          data-testid="download-manifest-json-error"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
