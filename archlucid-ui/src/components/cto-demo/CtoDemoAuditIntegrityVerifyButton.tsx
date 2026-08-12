"use client";

import { cn } from "@/lib/utils";
import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/ui/status-tag";
import {
  BUYER_CTO_DEMO_AUDIT_VERIFY_BUSY,
  BUYER_CTO_DEMO_AUDIT_VERIFY_CTA,
  BUYER_CTO_DEMO_AUDIT_VERIFY_FAIL,
  BUYER_CTO_DEMO_AUDIT_VERIFY_SUCCESS,
} from "@/lib/buyer/buyer-polish-copy";
import {
  formatAuditIntegrityHeadHash,
  type AuditIntegrityVerificationResult,
  verifyAuditIntegrityChain,
} from "@/lib/cto-demo-audit-integrity-chain";
import { readBuyerCtoDemoTourActive } from "@/lib/buyer/buyer-cto-demo-tour";
import { isCtoDemoPackEnv } from "@/lib/cto-demo-presenter-pack";
import { getDemoSampleAuditTrailEvents } from "@/lib/demo-audit-sample-events";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { showError } from "@/lib/toast";

function isCtoDemoAuditIntegrityVisible(): boolean {
  return isCtoDemoPackEnv() || (isBuyerPolishedOperatorShellEnv() && readBuyerCtoDemoTourActive());
}

/** Recomputes the append-only hash chain for the showcase audit trail during step 5. */
export function CtoDemoAuditIntegrityVerifyButton(): React.JSX.Element | null {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<AuditIntegrityVerificationResult | null>(null);

  const onVerify = useCallback(async () => {
    setBusy(true);

    try {
      const events = getDemoSampleAuditTrailEvents();
      const verification = await verifyAuditIntegrityChain(events);

      setResult(verification);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);

      showError("Audit integrity verification", message);
      setResult(null);
    } finally {
      setBusy(false);
    }
  }, []);

  if (!isCtoDemoAuditIntegrityVisible()) {
    return null;
  }

  return (
    <div className="inline-flex flex-col items-start gap-2" data-testid="cto-demo-audit-integrity-verify">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={busy}
        data-testid="cto-demo-audit-integrity-verify-btn"
        onClick={() => void onVerify()}
      >
        {busy ? BUYER_CTO_DEMO_AUDIT_VERIFY_BUSY : BUYER_CTO_DEMO_AUDIT_VERIFY_CTA}
      </Button>
      {result !== null ? (
        <div
          className="max-w-sm rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-2 dark:border-neutral-800"
          data-testid="cto-demo-audit-integrity-verify-result"
        >
          <StatusTag
            kind={result.verified ? "ready" : "blocked"}
            label={result.verified ? BUYER_CTO_DEMO_AUDIT_VERIFY_SUCCESS : BUYER_CTO_DEMO_AUDIT_VERIFY_FAIL}
          />
          <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.badge, "text-neutral-600 dark:text-neutral-400")}>
            {result.eventCount} events · head hash {formatAuditIntegrityHeadHash(result.headHash)}
          </p>
          {result.verified ? (
            <p
              className={cn("m-0 mt-2 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
              data-testid="cto-demo-audit-integrity-demo-disclaimer"
            >
              Verified against showcase demo events. Your production audit trail is verified server-side via the same
              algorithm.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
