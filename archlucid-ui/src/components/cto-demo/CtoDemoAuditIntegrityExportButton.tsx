"use client";

import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import { BUYER_CTO_DEMO_SHOWCASE_ANCHOR_ISO } from "@/lib/buyer/buyer-cto-demo-orchestration";
import {
  BUYER_CTO_DEMO_AUDIT_EXPORT_BUSY,
  BUYER_CTO_DEMO_AUDIT_EXPORT_CTA,
  BUYER_CTO_DEMO_AUDIT_EXPORT_SUCCESS,
} from "@/lib/buyer/buyer-polish-copy";
import { downloadAuditExportCsv } from "@/lib/api";
import { isCtoDemoPackEnv } from "@/lib/cto-demo-presenter-pack";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import { showError, showSuccess } from "@/lib/toast";

function ctoDemoAuditExportDateRange(): { readonly fromUtcIso: string; readonly toUtcIso: string } {
  const anchor = new Date(BUYER_CTO_DEMO_SHOWCASE_ANCHOR_ISO);
  const from = new Date(anchor);
  from.setUTCDate(from.getUTCDate() - 60);
  const to = new Date(anchor);
  to.setUTCDate(to.getUTCDate() + 30);

  return {
    fromUtcIso: from.toISOString(),
    toUtcIso: to.toISOString(),
  };
}

/** One-click GRC export for the showcase audit trail during the CTO demo step-5 close. */
export function CtoDemoAuditIntegrityExportButton(): React.JSX.Element | null {
  const [busy, setBusy] = useState(false);

  const onExport = useCallback(async () => {
    setBusy(true);

    try {
      const range = ctoDemoAuditExportDateRange();

      await downloadAuditExportCsv({
        fromUtcIso: range.fromUtcIso,
        toUtcIso: range.toUtcIso,
        maxRows: 10_000,
        runId: SHOWCASE_STATIC_DEMO_RUN_ID,
      });
      showSuccess(BUYER_CTO_DEMO_AUDIT_EXPORT_SUCCESS);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);

      showError("Audit export", message);
    } finally {
      setBusy(false);
    }
  }, []);

  if (!isCtoDemoPackEnv()) {
    return null;
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={busy}
      data-testid="cto-demo-audit-integrity-export"
      onClick={() => void onExport()}
    >
      {busy ? BUYER_CTO_DEMO_AUDIT_EXPORT_BUSY : BUYER_CTO_DEMO_AUDIT_EXPORT_CTA}
    </Button>
  );
}
