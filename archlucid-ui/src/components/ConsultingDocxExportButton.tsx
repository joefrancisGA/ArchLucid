"use client";

import { useState, type ReactNode } from "react";

import { Loader2 } from "lucide-react";

import { useOperatorNavAuthority } from "@/components/OperatorNavAuthorityProvider";
import { Button } from "@/components/ui/button";
import { downloadConsultingArchitectureReportDocx } from "@/lib/api";
import {
  CONSULTING_DOCX_EXPORT_PERMISSION,
  principalHasPermission,
} from "@/lib/current-principal";
import { recordFirstExportOpenedOnce } from "@/lib/first-tenant-funnel-telemetry";
import { showError } from "@/lib/toast";

export type ConsultingDocxExportButtonProps = {
  runId: string;
};

/**
 * Consulting-template DOCX export (requires `export:consulting-docx` on `/me`). POSTs through the proxy and saves the
 * file in the browser; API policies remain authoritative (403 when permission missing server-side).
 */
export function ConsultingDocxExportButton(props: ConsultingDocxExportButtonProps): ReactNode {
  const { runId } = props;
  const { currentPrincipal } = useOperatorNavAuthority();
  const [busy, setBusy] = useState(false);

  if (!principalHasPermission(currentPrincipal, CONSULTING_DOCX_EXPORT_PERMISSION)) {
    return null;
  }

  async function onExport(): Promise<void> {
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
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={busy}
      aria-busy={busy}
      onClick={() => void onExport()}
      data-testid="consulting-docx-export-button"
      className="inline-flex items-center gap-2"
    >
      {busy ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden /> : null}
      Export to DOCX
    </Button>
  );
}
