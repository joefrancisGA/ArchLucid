"use client";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  OPEN_QUESTIONS_WORKING_DOCUMENT_HONESTY_LABEL,
  OPEN_QUESTIONS_WORKING_DOCUMENT_EXPORT_HEADING,
} from "@/lib/architecture/architecture-open-questions-export-honesty";
import {
  buildTransparencyTrailExportSection,
  TRANSPARENCY_TRAIL_EXPORT_INCOMPLETE_BANNER,
} from "@/lib/feasibility/export-transparency-trail-section";
import { isTransparencyTrailComplete } from "@/lib/feasibility/transparency-trail-completeness";
import { cn } from "@/lib/utils";
import type { TransparencyTrail } from "@/types/feasibility-verdict";

export type PackagePrintTransparencyTrailSectionProps = {
  readonly trail: TransparencyTrail | null | undefined;
};

/** FC-53: print-visible asserted / inferred / skipped trail sections for meeting packets. */
export function PackagePrintTransparencyTrailSection(
  props: PackagePrintTransparencyTrailSectionProps,
): React.JSX.Element | null {
  const { trail } = props;

  if (trail === null || trail === undefined) {
    return (
      <section
        className="space-y-2"
        aria-labelledby="package-print-trail-heading"
        data-testid="package-print-transparency-trail"
      >
        <h2 id="package-print-trail-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>
          Transparency trail
        </h2>
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          {TRANSPARENCY_TRAIL_EXPORT_INCOMPLETE_BANNER.replace(/^>\s*\*\*[^*]+\*\*:\s*/, "")}
        </p>
      </section>
    );
  }

  if (!isTransparencyTrailComplete(trail)) {
    return (
      <section
        className="space-y-2"
        aria-labelledby="package-print-trail-heading"
        data-testid="package-print-transparency-trail"
      >
        <h2 id="package-print-trail-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>
          Transparency trail
        </h2>
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          {TRANSPARENCY_TRAIL_EXPORT_INCOMPLETE_BANNER.replace(/^>\s*\*\*[^*]+\*\*:\s*/, "")}
        </p>
      </section>
    );
  }

  const section = buildTransparencyTrailExportSection(trail);

  if (section === null) {
    return null;
  }

  return (
    <section
      className="space-y-3"
      aria-labelledby="package-print-trail-heading"
      data-testid="package-print-transparency-trail"
    >
      <h2 id="package-print-trail-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>
        Transparency trail
      </h2>
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        What was asserted, inferred, and skipped for this review.
      </p>

      <div className="space-y-2" data-testid="package-print-trail-asserted">
        <h3 className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>Asserted ({section.asserted.length})</h3>
        {section.asserted.length > 0 ? (
          <ul className="m-0 list-disc space-y-1 pl-5">
            {section.asserted.map((entry) => (
              <li key={`${entry.key}:${entry.value}`}>
                {entry.key}: {entry.value}
              </li>
            ))}
          </ul>
        ) : (
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>None recorded.</p>
        )}
      </div>

      <div className="space-y-2" data-testid="package-print-trail-inferred">
        <h3 className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>Inferred ({section.inferred.length})</h3>
        {section.inferred.length > 0 ? (
          <ul className="m-0 list-disc space-y-1 pl-5">
            {section.inferred.map((entry) => (
              <li key={`${entry.key}:${entry.value}`}>
                {entry.key}: {entry.value} (confidence {entry.confidence})
              </li>
            ))}
          </ul>
        ) : (
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>None recorded.</p>
        )}
      </div>

      {section.skipped.length > 0 ? (
        <div className="space-y-2" data-testid="package-print-trail-skipped">
          <h3 className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>Skipped ({section.skipped.length})</h3>
          <ul className="m-0 list-disc space-y-1 pl-5">
            {section.skipped.map((entry) => (
              <li key={entry.questionKey}>
                {entry.questionKey} ({entry.tier})
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {section.workingDocumentOpenQuestions.length > 0 ? (
        <div className="space-y-2" data-testid="package-print-trail-working-open-questions">
          <h3 className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>{OPEN_QUESTIONS_WORKING_DOCUMENT_EXPORT_HEADING}</h3>
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            {OPEN_QUESTIONS_WORKING_DOCUMENT_HONESTY_LABEL} — not asserted intake unless confirmed through the trail.
          </p>
          <ul className="m-0 list-disc space-y-1 pl-5">
            {section.workingDocumentOpenQuestions.map((entry) => (
              <li key={`${entry.key}:${entry.value}`}>
                {entry.key}: {entry.value}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
