"use client";

import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";

import { AuditTrailClaimOrientationStrip } from "@/components/audit/AuditTrailClaimOrientationStrip";

/** Buyer default: mount claim discipline + Sources above the audit trail body. */
export function AuditPageBuyerChrome(): React.JSX.Element | null {
  if (!isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  return (
    <div className="mb-4 text-left" data-testid="audit-page-orientation-top">
      <AuditTrailClaimOrientationStrip />
    </div>
  );
}
