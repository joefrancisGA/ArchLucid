import Link from "next/link";

import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { ProcurementEvidenceArtifactRow } from "@/lib/procurement/procurement-evidence-map-copy";
import {
  PROCUREMENT_EVIDENCE_MAP_HEADING,
  PROCUREMENT_EVIDENCE_MAP_LEAD,
} from "@/lib/procurement/procurement-evidence-map-copy";
import { cn } from "@/lib/utils";

type ProcurementEvidenceMapSectionProps = {
  readonly rows: readonly ProcurementEvidenceArtifactRow[];
  readonly heading?: string;
  readonly lead?: string;
  readonly testId?: string;
};

export function ProcurementEvidenceMapSection(props: ProcurementEvidenceMapSectionProps): React.JSX.Element {
  const testId = props.testId ?? "procurement-evidence-map";

  return (
    <section aria-labelledby={`${testId}-heading`} className="space-y-3" data-testid={testId}>
      <h2 id={`${testId}-heading`} className={OPERATOR_TYPOGRAPHY.cardTitle}>
        {props.heading ?? PROCUREMENT_EVIDENCE_MAP_HEADING}
      </h2>
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>{props.lead ?? PROCUREMENT_EVIDENCE_MAP_LEAD}</p>
      <ul
        className="m-0 list-none space-y-2 p-0"
        aria-labelledby={`${testId}-heading`}
      >
        {props.rows.map((row) => (
          <li
            key={row.id}
            className="rounded-md border border-neutral-200 p-3 dark:border-neutral-800"
            data-testid={`${testId}-row-${row.id}`}
          >
            <p className={cn("m-0 font-medium", OPERATOR_TYPOGRAPHY.body)}>
              {row.status === "available" && row.href !== null ? (
                <Link className={OPERATOR_LINK.inline} href={row.href}>
                  {row.label}
                </Link>
              ) : (
                row.label
              )}
            </p>
            <p className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.helper)}>
              {row.status === "not-published" ? "Not published. " : "Available. "}
              {row.note}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
