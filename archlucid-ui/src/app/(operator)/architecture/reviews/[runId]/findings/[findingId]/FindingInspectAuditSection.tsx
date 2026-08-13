import { cn } from "@/lib/utils";
import Link from "next/link";

import type { ReactElement } from "react";

import { CopyIdButton } from "@/components/CopyIdButton";
import {
  BUYER_SHOWCASE_RESIDUAL_RISK_MONITORING_CADENCE,
  BUYER_SHOWCASE_RESIDUAL_RISK_OWNER,
} from "@/lib/buyer/buyer-polish-copy";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { GOVERNANCE_AUDIT_PATH } from "@/lib/governance/governance-route-paths";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type FindingInspectAuditSectionProps = {
  readonly auditRowId: string | null | undefined;
  readonly demoFillGaps: boolean;
};

/** Human-readable audit linkage — shown on both detail and inspect. */
export function FindingInspectAuditSection({
  auditRowId,
  demoFillGaps,
}: FindingInspectAuditSectionProps): ReactElement {
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  return (
    <section className="rounded-lg border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40">
      <h2 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>Audit record</h2>
      {auditRowId ? (
        buyerPolishedShell ? (
          <div className={cn("m-0 mt-2 flex flex-wrap items-center gap-2 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
            <span>Recorded in the audit trail for this review.</span>
            <CopyIdButton value={auditRowId} aria-label="Copy audit event ID" />
            <Link href={GOVERNANCE_AUDIT_PATH} className={OPERATOR_LINK.nav}>
              View in audit trail
            </Link>
          </div>
        ) : (
          <p className={cn("m-0 mt-2 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
            Durable audit event id: <span className={cn("font-mono", OPERATOR_TYPOGRAPHY.micro)}>{auditRowId}</span>
            <span className="ml-2">
              <Link href={GOVERNANCE_AUDIT_PATH} className={OPERATOR_LINK.nav}>
                View in audit trail
              </Link>
            </span>
          </p>
        )
      ) : demoFillGaps && !buyerPolishedShell ? (
        <div className={cn("mt-2 space-y-1 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
          <p className="m-0">
            <strong className="font-medium">Related audit event</strong> — Monitored finding recorded with governance
            disposition and policy rule linkage. Actor:{" "}
            <span className="text-al-text-secondary">Jordan Lee (Architecture approver)</span>
            {" · "}
            Outcome:{" "}
            <span className="text-al-text-secondary">Accepted with monitoring — residual risk owner {BUYER_SHOWCASE_RESIDUAL_RISK_OWNER}</span>
          </p>
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            {BUYER_SHOWCASE_RESIDUAL_RISK_MONITORING_CADENCE} applies while this monitored risk remains open.
          </p>
        </div>
      ) : buyerPolishedShell ? (
        <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          No linked audit event for this finding.
        </p>
      ) : (
        <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          Audit record not available in this environment (SQL-backed audit logging may be disabled).
        </p>
      )}
    </section>
  );
}
