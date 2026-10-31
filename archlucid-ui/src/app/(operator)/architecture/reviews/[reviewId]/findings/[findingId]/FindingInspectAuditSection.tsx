import { cn } from "@/lib/utils";
import Link from "next/link";

import type { ReactElement } from "react";

import { CopyIdButton } from "@/components/CopyIdButton";
import { resolveProductionEvalChromeFromStorage } from "@/lib/resolve-production-eval-chrome-from-storage";
import { GOVERNANCE_AUDIT_PATH } from "@/lib/governance/governance-route-paths";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export const FINDING_INSPECT_AUDIT_RECORD_NOT_STORED = "Audit record was not stored." as const;

export type FindingInspectAuditSectionProps = {
  readonly auditRowId: string | null | undefined;
  readonly demoFillGaps: boolean;
};

/** Human-readable audit linkage — shown on both detail and inspect. */
export function FindingInspectAuditSection({
  auditRowId,
}: FindingInspectAuditSectionProps): ReactElement {
  const buyerPolishedShell = resolveProductionEvalChromeFromStorage();

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
      ) : (
        <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          {FINDING_INSPECT_AUDIT_RECORD_NOT_STORED}
        </p>
      )}
    </section>
  );
}
