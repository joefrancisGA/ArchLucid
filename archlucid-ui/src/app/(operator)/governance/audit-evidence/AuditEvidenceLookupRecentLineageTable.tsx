"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  AUDIT_EVIDENCE_LOOKUP_RECENT_LINEAGE_COPY_ACTION,
  AUDIT_EVIDENCE_LOOKUP_RECENT_LINEAGE_FILL_ACTION,
  AUDIT_EVIDENCE_LOOKUP_RECENT_LINEAGE_IDS_DISCLOSURE,
  AUDIT_EVIDENCE_LOOKUP_RECENT_LINEAGE_TITLE,
} from "@/lib/audit-evidence-page-copy";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { formatRelativeTime } from "@/lib/relative-time";
import type { ContinueLastAuditEvidenceLineageTarget } from "@/lib/resolve-continue-last-audit-evidence-lineage";
import { cn } from "@/lib/utils";

export type AuditEvidenceLookupRecentLineageTableProps = {
  readonly targets: readonly ContinueLastAuditEvidenceLineageTarget[];
  readonly onPrefill: (target: ContinueLastAuditEvidenceLineageTarget) => void;
};

function formatIdentifierShort(value: string): string {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return "—";
  }

  return trimmed.length > 10 ? `${trimmed.slice(0, 10)}…` : trimmed;
}

async function copyLineageHref(href: string): Promise<void> {
  if (typeof navigator === "undefined" || navigator.clipboard?.writeText == null) {
    return;
  }

  try {
    await navigator.clipboard.writeText(href);
  } catch {
    /* clipboard unavailable */
  }
}

/** Recent audit evidence lineage visits for quick resume on lookup. */
export function AuditEvidenceLookupRecentLineageTable(
  props: AuditEvidenceLookupRecentLineageTableProps,
): React.JSX.Element | null {
  if (props.targets.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby="audit-evidence-lookup-recent-lineage-heading"
      data-testid="audit-evidence-lookup-recent-lineage-table"
    >
      <h2
        id="audit-evidence-lookup-recent-lineage-heading"
        className={cn("m-0", OPERATOR_TYPOGRAPHY.sectionTitle)}
      >
        {AUDIT_EVIDENCE_LOOKUP_RECENT_LINEAGE_TITLE}
      </h2>
      <table className="mt-2 w-full max-w-4xl border-collapse text-sm">
        <thead>
          <tr className="border-b border-neutral-200 text-left dark:border-neutral-800">
            <th className="py-1 pr-3 font-medium">Control</th>
            <th className="py-1 pr-3 font-medium">Assessment</th>
            <th className="py-1 pr-3 font-medium">Snapshot</th>
            <th className="py-1 pr-3 font-medium">Viewed</th>
            <th className="py-1 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {props.targets.map((target) => (
            <tr
              key={`${target.assessmentId}-${target.snapshotId}-${target.controlId}-${target.viewedAtUtc}`}
              className="border-b border-neutral-100 dark:border-neutral-900"
              data-testid="audit-evidence-lookup-recent-lineage-row"
            >
              <td className="py-2 pr-3">
                <Link
                  href={target.href}
                  className={cn("text-al-link hover:underline", OPERATOR_LINK.inline)}
                  data-testid="audit-evidence-lookup-recent-lineage-open"
                >
                  {target.label}
                </Link>
              </td>
              <td className="py-2 pr-3 font-mono text-xs text-al-text-secondary">
                {formatIdentifierShort(target.assessmentId)}
              </td>
              <td className="py-2 pr-3 font-mono text-xs text-al-text-secondary">
                {formatIdentifierShort(target.snapshotId)}
              </td>
              <td className="py-2 pr-3 text-al-text-secondary">{formatRelativeTime(target.viewedAtUtc)}</td>
              <td className="py-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    data-testid="audit-evidence-lookup-recent-lineage-copy"
                    onClick={() => {
                      void copyLineageHref(target.href);
                    }}
                  >
                    {AUDIT_EVIDENCE_LOOKUP_RECENT_LINEAGE_COPY_ACTION}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    data-testid="audit-evidence-lookup-recent-lineage-fill"
                    onClick={() => {
                      props.onPrefill(target);
                    }}
                  >
                    {AUDIT_EVIDENCE_LOOKUP_RECENT_LINEAGE_FILL_ACTION}
                  </Button>
                  <details data-testid="audit-evidence-lookup-recent-lineage-ids-disclosure">
                    <summary className={cn("cursor-pointer text-al-link", OPERATOR_LINK.inline)}>
                      {AUDIT_EVIDENCE_LOOKUP_RECENT_LINEAGE_IDS_DISCLOSURE}
                    </summary>
                    <dl className={cn("m-0 mt-2 space-y-1 font-mono text-xs", OPERATOR_TYPOGRAPHY.micro)}>
                      <div>
                        <dt className="inline font-medium text-al-text-primary">Assessment:</dt>{" "}
                        <dd className="inline text-al-text-secondary">{target.assessmentId}</dd>
                      </div>
                      <div>
                        <dt className="inline font-medium text-al-text-primary">Snapshot:</dt>{" "}
                        <dd className="inline text-al-text-secondary">{target.snapshotId}</dd>
                      </div>
                      <div>
                        <dt className="inline font-medium text-al-text-primary">Control:</dt>{" "}
                        <dd className="inline text-al-text-secondary">{target.controlId}</dd>
                      </div>
                    </dl>
                  </details>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
