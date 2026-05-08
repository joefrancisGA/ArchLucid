import Link from "next/link";

import type { ReactElement } from "react";

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
      <h2 className="m-0 text-sm font-semibold text-neutral-900 dark:text-neutral-100">Audit</h2>
      {auditRowId ? (
        <p className="m-0 mt-2 text-sm text-neutral-800 dark:text-neutral-200">
          Durable audit event id: <span className="font-mono text-xs">{auditRowId}</span>
          <span className="ml-2">
            <Link href="/audit" className="text-sky-700 underline dark:text-sky-300">
              Search in audit log
            </Link>
          </span>
        </p>
      ) : demoFillGaps ? (
        <div className="mt-2 space-y-1 text-sm text-neutral-800 dark:text-neutral-200">
          <p className="m-0">
            <strong className="font-medium">Sample audit trail (demo)</strong> — Finding recorded with severity review and rule
            linkage. Actor: <span className="text-neutral-600 dark:text-neutral-400">Governance automation</span>
            {" · "}
            Outcome: <span className="text-neutral-600 dark:text-neutral-400">Escalated for architecture review</span>
          </p>
          <p className="m-0 text-xs text-neutral-600 dark:text-neutral-400">
            Production tenants emit the same fields from tenant-scoped audit storage.
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
