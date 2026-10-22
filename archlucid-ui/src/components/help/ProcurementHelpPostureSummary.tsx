import { StatusTag } from "@/components/StatusTag";
import { PROCUREMENT_FAQ_POSTURES } from "@/lib/procurement-help-presentation";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Compact assurance posture rollup for procurement FAQ Q1 and Q2. */
export function ProcurementHelpPostureSummary(): React.JSX.Element {
  return (
    <section
      aria-labelledby="procurement-help-posture-heading"
      className="rounded-md border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-700 dark:bg-neutral-900/40"
      data-testid="procurement-help-posture-summary"
    >
      <h2
        id="procurement-help-posture-heading"
        className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}
      >
        Assurance posture at a glance
      </h2>
      <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        High-signal answers for SOC 2 and penetration-test diligence — details in the Q &amp; A below.
      </p>
      <ul className={cn("m-0 mt-2 list-none space-y-2 p-0", OPERATOR_TYPOGRAPHY.body)}>
        {PROCUREMENT_FAQ_POSTURES.map((posture) => (
          <li key={posture.key} className="flex flex-wrap items-start gap-2">
            <StatusTag kind={posture.kind} label={posture.label} />
            <span className="text-al-text-secondary" data-testid={`procurement-help-posture-${posture.key}`}>
              Q{posture.questionNumber}: {posture.summary}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
