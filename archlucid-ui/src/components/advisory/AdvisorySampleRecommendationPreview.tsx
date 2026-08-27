"use client";

import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import {
  ADVISORY_SCANS_DISPOSITION_ACCEPT,
  ADVISORY_SCANS_DISPOSITION_ACCEPT_HINT,
  ADVISORY_SCANS_DISPOSITION_DEFER,
  ADVISORY_SCANS_DISPOSITION_DEFER_HINT,
  ADVISORY_SCANS_DISPOSITION_IMPLEMENTED,
  ADVISORY_SCANS_DISPOSITION_IMPLEMENTED_HINT,
  ADVISORY_SCANS_DISPOSITION_REJECT,
  ADVISORY_SCANS_DISPOSITION_REJECT_HINT,
  ADVISORY_SCANS_SAMPLE_BADGE_LABEL,
  ADVISORY_SCANS_SAMPLE_DISPOSITION_SUMMARY,
  ADVISORY_SCANS_SAMPLE_RECOMMENDATION,
  ADVISORY_SCANS_SAMPLE_SECTION_TITLE,
} from "@/lib/advisory-copy";
import { OPERATOR_SURFACE_CARD_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

const SAMPLE_DISPOSITION_ACTIONS: ReadonlyArray<{ readonly label: string; readonly hint: string }> = [
  { label: ADVISORY_SCANS_DISPOSITION_ACCEPT, hint: ADVISORY_SCANS_DISPOSITION_ACCEPT_HINT },
  { label: ADVISORY_SCANS_DISPOSITION_DEFER, hint: ADVISORY_SCANS_DISPOSITION_DEFER_HINT },
  { label: ADVISORY_SCANS_DISPOSITION_REJECT, hint: ADVISORY_SCANS_DISPOSITION_REJECT_HINT },
  { label: ADVISORY_SCANS_DISPOSITION_IMPLEMENTED, hint: ADVISORY_SCANS_DISPOSITION_IMPLEMENTED_HINT },
];

/** Preview card illustrating advisory recommendation value before a scan is generated. */
export function AdvisorySampleRecommendationPreview(): React.JSX.Element {
  const sample = ADVISORY_SCANS_SAMPLE_RECOMMENDATION;

  return (
    <section
      id="advisory-sample-recommendation"
      data-testid="advisory-sample-recommendation"
      className={cn(OPERATOR_SURFACE_CARD_CLASS, "border-neutral-200 bg-neutral-50/80 dark:border-neutral-700 dark:bg-neutral-900/40")}
      aria-label={ADVISORY_SCANS_SAMPLE_SECTION_TITLE}
      tabIndex={-1}
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h3 className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
          {ADVISORY_SCANS_SAMPLE_SECTION_TITLE}
        </h3>
        <Badge variant="secondary">{ADVISORY_SCANS_SAMPLE_BADGE_LABEL}</Badge>
      </div>

      <div className={cn("rounded-md border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-950", OPERATOR_TYPOGRAPHY.body)}>
        <p className={cn("m-0 font-medium text-amber-800 dark:text-amber-200", OPERATOR_TYPOGRAPHY.helper)}>
          {sample.impactLevel}
        </p>
        <p className="m-0 mt-2 font-semibold text-neutral-900 dark:text-neutral-100">{sample.title}</p>
        <p className={cn("m-0 mt-2 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
          <span className="font-medium text-neutral-800 dark:text-neutral-200">Related finding or risk:</span>{" "}
          {sample.relatedFinding}
        </p>
        <p className={cn("m-0 mt-2 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
          <span className="font-medium text-neutral-800 dark:text-neutral-200">Evidence basis:</span> {sample.evidenceBasis}
        </p>
        <p className="m-0 mt-2 text-neutral-700 dark:text-neutral-300">{sample.body}</p>
        <p className="m-0 mt-2 text-neutral-600 dark:text-neutral-400">
          <span className="font-medium text-neutral-800 dark:text-neutral-200">Suggested action:</span>{" "}
          {sample.suggestedAction}
        </p>
        <p className={cn("m-0 mt-2 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
          <span className="font-medium text-neutral-800 dark:text-neutral-200">Owner or role:</span> {sample.ownerRole}
        </p>

        <details
          className="mt-4 rounded-md border border-neutral-200 bg-neutral-50/80 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900/40"
          data-testid="advisory-sample-disposition-disclosure"
        >
          <summary
            className={cn(
              "cursor-pointer font-medium text-neutral-800 dark:text-neutral-200",
              OPERATOR_TYPOGRAPHY.helper,
            )}
          >
            {ADVISORY_SCANS_SAMPLE_DISPOSITION_SUMMARY}
          </summary>
          <ul
            className="mt-3 m-0 flex list-none flex-wrap gap-2 p-0"
            data-testid="advisory-sample-disposition-chips"
            aria-label={ADVISORY_SCANS_SAMPLE_DISPOSITION_SUMMARY}
          >
            {SAMPLE_DISPOSITION_ACTIONS.map((action) => (
              <li key={action.label}>
                <Badge
                  variant="secondary"
                  title={action.hint}
                  className="border border-neutral-300 bg-neutral-200 px-3 py-1 text-neutral-900 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-50"
                >
                  {action.label}
                </Badge>
              </li>
            ))}
          </ul>
        </details>
      </div>
    </section>
  );
}
