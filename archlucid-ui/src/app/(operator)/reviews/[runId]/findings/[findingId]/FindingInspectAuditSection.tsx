import Link from "next/link";

import type { ReactElement } from "react";

import {
  BUYER_SHOWCASE_RESIDUAL_RISK_MONITORING_CADENCE,
  BUYER_SHOWCASE_RESIDUAL_RISK_OWNER,
} from "@/lib/buyer-polish-copy";

export type FindingInspectAuditSectionProps = {
  readonly auditRowId: string | null | undefined;
  readonly demoFillGaps: boolean;
};

/** Human-readable audit linkage — shown on both detail and inspect. */
export function FindingInspectAuditSection({
  auditRowId,
  demoFillGaps,
}: FindingInspectAuditSectionProps): ReactElement {
  return (
    <section className="rounded-lg border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40">
      <h2 className="m-0 text-sm font-semibold text-neutral-900 dark:text-neutral-100">Audit record</h2>
      {auditRowId ? (
        <p className="m-0 mt-2 text-sm text-neutral-800 dark:text-neutral-200">
          Durable audit event id: <span className="font-mono text-xs">{auditRowId}</span>
          <span className="ml-2">
            <Link href="/audit" className="text-sky-700 underline dark:text-sky-300">
              View in audit trail
            </Link>
          </span>
        </p>
      ) : demoFillGaps ? (
        <div className="mt-2 space-y-1 text-sm text-neutral-800 dark:text-neutral-200">
          <p className="m-0">
            <strong className="font-medium">Related audit event</strong> — Risk observation recorded with governance
            disposition and policy rule linkage. Actor:{" "}
            <span className="text-neutral-600 dark:text-neutral-400">Jordan Lee (Architecture approver)</span>
            {" · "}
            Outcome:{" "}
            <span className="text-neutral-600 dark:text-neutral-400">Accepted with monitoring — residual risk owner {BUYER_SHOWCASE_RESIDUAL_RISK_OWNER}</span>
          </p>
          <p className="m-0 text-xs text-neutral-600 dark:text-neutral-400">
            {BUYER_SHOWCASE_RESIDUAL_RISK_MONITORING_CADENCE} applies while this monitored risk remains open.
          </p>
        </div>
      ) : (
        <p className="m-0 mt-2 text-sm text-neutral-600 dark:text-neutral-400">
          Audit record not available in this environment (SQL-backed audit logging may be disabled).
        </p>
      )}
    </section>
  );
}
