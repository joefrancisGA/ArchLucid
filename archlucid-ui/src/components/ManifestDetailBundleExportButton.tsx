"use client";

import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import { downloadArtifactBundleZip } from "@/lib/api/downloads-blob-trigger-artifact-bundle";
import { artifactBundleMutationBlockedReason } from "@/lib/runs/artifact-bundle-mutation-blocked-reason";
import { runCollateralSealedManifestCopyBlockedReason } from "@/lib/runs/run-collateral-sealed-manifest-guard";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { showError } from "@/lib/toast";

type ManifestDetailBundleExportButtonProps = {
  readonly manifestId: string;
  readonly runId: string;
  readonly label: string;
  readonly variant?: "primary" | "outline" | "secondary";
  readonly size?: "sm" | "default";
};

/** Programmatic bundle ZIP export for sealed-record detail headers (wave 47). */
export function ManifestDetailBundleExportButton(props: ManifestDetailBundleExportButtonProps) {
  const { manifestId, runId, label, variant = "primary", size = "sm" } = props;
  const [busy, setBusy] = useState(false);
  const blockedReason = runCollateralSealedManifestCopyBlockedReason({
    runId: runId.trim(),
    manifestVersion: manifestId.trim(),
  });

  const onDownload = useCallback(() => {
    if (blockedReason !== null) {
      return;
    }

    setBusy(true);

    void downloadArtifactBundleZip(manifestId)
      .catch((error: unknown) => {
        const failure = toApiLoadFailure(error);
        const blocked = artifactBundleMutationBlockedReason(failure);

        showError("Bundle download", blocked ?? failure.message);
      })
      .finally(() => {
        setBusy(false);
      });
  }, [blockedReason, manifestId]);

  if (blockedReason !== null) {
    return (
      <Button variant={variant} size={size} disabled data-testid="manifest-detail-bundle-export-blocked">
        {label}
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      disabled={busy}
      data-testid="manifest-detail-bundle-export"
      onClick={onDownload}
    >
      {busy ? "Downloading…" : label}
    </Button>
  );
}
