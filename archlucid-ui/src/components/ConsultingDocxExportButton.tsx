"use client";

import { useState, type ReactNode } from "react";

import { Loader2 } from "lucide-react";

import { useOperatorNavAuthority } from "@/components/operator/OperatorNavAuthorityProvider";
import { Button } from "@/components/ui/button";
import { downloadConsultingArchitectureReportDocx } from "@/lib/api";
import {
  CONSULTING_DOCX_EXPORT_PERMISSION,
  principalHasPermission,
} from "@/lib/current-principal";
import { recordFirstExportOpenedOnce } from "@/lib/first-tenant-funnel-telemetry";
import { showError } from "@/lib/toast";

import { runCollateralSealedManifestCopyBlockedReason } from "@/lib/runs/run-collateral-sealed-manifest-guard";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type ConsultingDocxExportButtonProps = {
  runId: string;
  readonly manifestVersion?: string | null;
};

/**
 * Consulting-template DOCX export (requires `export:consulting-docx` on `/me`). POSTs through the proxy and saves the
 * file in the browser; API policies remain authoritative (403 when permission missing server-side).
 */
export function ConsultingDocxExportButton(props: ConsultingDocxExportButtonProps): ReactNode {
  const { runId, manifestVersion = null } = props;
  const { currentPrincipal } = useOperatorNavAuthority();
  const [busy, setBusy] = useState(false);
  const sealedManifestBlockedReason = runCollateralSealedManifestCopyBlockedReason({
    runId,
    manifestVersion,
  });

  if (!principalHasPermission(currentPrincipal, CONSULTING_DOCX_EXPORT_PERMISSION)) {
    return null;
  }

  async function onExport(): Promise<void> {
    if (sealedManifestBlockedReason !== null) {
      return;
    }

    recordFirstExportOpenedOnce();
    setBusy(true);

    try {
      await downloadConsultingArchitectureReportDocx(runId);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      showError("Could not export consulting DOCX", msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={busy || sealedManifestBlockedReason !== null}
        aria-busy={busy}
        onClick={() => void onExport()}
        data-testid="consulting-docx-export-button"
        className="inline-flex items-center gap-2"
      >
        {busy ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden /> : null}
        Export to DOCX
      </Button>
      {sealedManifestBlockedReason !== null ? (
        <p
          role="alert"
          className={cn("m-0 text-rose-700 dark:text-rose-300", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="consulting-docx-export-blocked-reason"
        >
          {sealedManifestBlockedReason}
        </p>
      ) : null}
    </div>
  );
}
