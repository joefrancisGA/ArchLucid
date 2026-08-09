import { StatusTag } from "@/components/StatusTag";
import type { CaiqSigResponsePostureCounts } from "@/lib/caiq-sig-response-help-presentation";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type CaiqSigResponseHelpPostureSummaryProps = {
  readonly counts: CaiqSigResponsePostureCounts;
};

const POSTURE_ROWS = [
  { key: "Strong" as const, kind: "ready" as const },
  { key: "Partial" as const, kind: "needs-attention" as const },
  { key: "Planned" as const, kind: "in-progress" as const },
  { key: "Inherited" as const, kind: "approved-with-monitoring" as const },
];

/** Compact posture rollup for CAIQ Lite + SIG Core questionnaire rows. */
export function CaiqSigResponseHelpPostureSummary(
  props: CaiqSigResponseHelpPostureSummaryProps,
): React.JSX.Element {
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
        SIG Core Status counts, plus CAIQ Lite Response rows marked Partial. Yes/No stay on Response cells.
      </p>
      <ul className={cn("m-0 mt-2 flex list-none flex-wrap gap-2 p-0", OPERATOR_TYPOGRAPHY.body)}>
        {POSTURE_ROWS.map((row) => (
          <li key={row.key} className="inline-flex items-center gap-1.5">
            <StatusTag kind={row.kind} label={row.key} />
            <span className="text-al-text-secondary" data-testid={`caiq-sig-posture-count-${row.key.toLowerCase()}`}>
              {props.counts[row.key]}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
