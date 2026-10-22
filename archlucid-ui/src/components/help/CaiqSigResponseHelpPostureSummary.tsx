import { StatusTag } from "@/components/StatusTag";
import type { CaiqSigResponsePostureCounts } from "@/lib/caiq-sig-response-help-presentation";
import { sumCaiqSigResponsePostureCounts } from "@/lib/caiq-sig-response-help-presentation";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type CaiqSigResponseHelpPostureSummaryProps = {
  readonly counts: CaiqSigResponsePostureCounts;
  readonly tableRowTotal: number;
};

const POSTURE_ROWS = [
  { key: "Affirmative" as const, kind: "ready" as const, label: "Yes" },
  { key: "Strong" as const, kind: "ready" as const, label: "Strong" },
  { key: "Partial" as const, kind: "needs-attention" as const, label: "Partial" },
  { key: "Planned" as const, kind: "in-progress" as const, label: "Planned" },
  { key: "Inherited" as const, kind: "approved-with-monitoring" as const, label: "Inherited" },
];

/** Compact posture rollup for CAIQ Lite + SIG Core questionnaire rows. */
export function CaiqSigResponseHelpPostureSummary(
  props: CaiqSigResponseHelpPostureSummaryProps,
): React.JSX.Element {
  const classifiedTotal = sumCaiqSigResponsePostureCounts(props.counts);

  return (
    <section
      aria-labelledby="caiq-sig-response-help-posture-heading"
      className="rounded-md border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-700 dark:bg-neutral-900/40"
      data-testid="caiq-sig-response-help-posture-summary"
    >
      <h2
        id="caiq-sig-response-help-posture-heading"
        className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}
      >
        Posture summary
      </h2>
      <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        Counts reconcile with Status and Response chips in the tables below ({classifiedTotal} of{" "}
        {props.tableRowTotal} rows).
      </p>
      <ul className={cn("m-0 mt-2 flex list-none flex-wrap gap-2 p-0", OPERATOR_TYPOGRAPHY.body)}>
        {POSTURE_ROWS.map((row) => (
          <li key={row.key} className="inline-flex items-center gap-1.5">
            <StatusTag kind={row.kind} label={row.label} />
            <span className="text-al-text-secondary" data-testid={`caiq-sig-posture-count-${row.key.toLowerCase()}`}>
              {props.counts[row.key]}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
