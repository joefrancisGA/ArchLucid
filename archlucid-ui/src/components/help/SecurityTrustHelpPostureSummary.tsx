import { StatusTag } from "@/components/StatusTag";
import {
  sumSecurityTrustPostureCounts,
  type SecurityTrustPostureCounts,
} from "@/lib/security-trust-help-presentation";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type SecurityTrustHelpPostureSummaryProps = {
  readonly counts: SecurityTrustPostureCounts;
  readonly tableRowTotal: number;
};

const POSTURE_ROWS = [
  { key: "selfAsserted" as const, kind: "neutral" as const, label: "Self-asserted" },
  { key: "planned" as const, kind: "in-progress" as const, label: "Planned" },
  { key: "active" as const, kind: "in-progress" as const, label: "Active" },
  { key: "templateOnly" as const, kind: "neutral" as const, label: "Template only" },
  { key: "notIssued" as const, kind: "needs-attention" as const, label: "Not issued" },
];

/** Compact assurance-mix rollup above the posture summary table on `/help/security-trust`. */
export function SecurityTrustHelpPostureSummary(
  props: SecurityTrustHelpPostureSummaryProps,
): React.JSX.Element {
  const classifiedTotal = sumSecurityTrustPostureCounts(props.counts);

  return (
    <section
      aria-labelledby="security-trust-help-posture-heading"
      className="rounded-md border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-700 dark:bg-neutral-900/40"
      data-testid="security-trust-help-posture-summary"
    >
      <h2
        id="security-trust-help-posture-heading"
        className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}
      >
        Assurance mix
      </h2>
      <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        Posture summary rows by status ({classifiedTotal} of {props.tableRowTotal} controls). Third-party attested
        controls: 0.
      </p>
      <ul className={cn("m-0 mt-2 flex list-none flex-wrap gap-2 p-0", OPERATOR_TYPOGRAPHY.body)}>
        {POSTURE_ROWS.map((row) => (
          <li key={row.key} className="inline-flex items-center gap-1.5">
            <StatusTag kind={row.kind} label={row.label} />
            <span className="text-al-text-secondary" data-testid={`security-trust-posture-count-${row.key}`}>
              {props.counts[row.key]}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
