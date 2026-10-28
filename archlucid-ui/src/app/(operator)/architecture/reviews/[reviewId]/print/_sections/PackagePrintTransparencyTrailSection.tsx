"use client";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { ARCHITECTURE_IDENTITY_DESK_OPEN_QUESTIONS_NOT_STORED } from "@/lib/architecture/architecture-open-questions-copy";
import {
  OPEN_QUESTIONS_WORKING_DOCUMENT_HONESTY_LABEL,
  OPEN_QUESTIONS_WORKING_DOCUMENT_EXPORT_HEADING,
} from "@/lib/architecture/architecture-open-questions-export-honesty";
import {
  buildTransparencyTrailExportSection,
  TRANSPARENCY_TRAIL_EXPORT_INCOMPLETE_BANNER,
} from "@/lib/feasibility/export-transparency-trail-section";
import { formatInferredTrailEntryLabel } from "@/lib/feasibility/format-inferred-trail-entry-label";
import {
  formatAssertedTrailLine,
  formatSkippedTrailExportLine,
} from "@/lib/feasibility/format-transparency-trail-entry-display";
import { isTransparencyTrailComplete } from "@/lib/feasibility/transparency-trail-completeness";
import { cn } from "@/lib/utils";
import type { TransparencyTrail } from "@/types/feasibility-verdict";

export type PackagePrintTransparencyTrailSectionProps = {
  readonly trail: TransparencyTrail | null | undefined;
};

function mustSkippedEntries(trail: TransparencyTrail): TransparencyTrail["skipped"] {
  return trail.skipped.filter((entry) => entry.tier === "Must");
}

function shouldSkippedEntries(trail: TransparencyTrail): TransparencyTrail["skipped"] {
  return trail.skipped.filter((entry) => entry.tier === "Should");
}

/** FC-53: print-visible asserted / inferred / skipped trail sections for meeting packets. */
export function PackagePrintTransparencyTrailSection(
  props: PackagePrintTransparencyTrailSectionProps,
): React.JSX.Element | null {
  const { trail } = props;
  const incompleteBannerBody = TRANSPARENCY_TRAIL_EXPORT_INCOMPLETE_BANNER.replace(/^>\s*\*\*[^*]+\*\*:\s*/, "");

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
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>{incompleteBannerBody}</p>
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
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>{incompleteBannerBody}</p>
      </section>
    );
  }

  const section = buildTransparencyTrailExportSection(trail);

  if (section === null) {
    return null;
  }

  const mustSkipped = mustSkippedEntries(trail);
  const shouldSkipped = shouldSkippedEntries(trail);

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
        What was asserted, inferred, and skipped for this review. This print summary is not a signed export artifact.
      </p>

      <div className="space-y-2" data-testid="package-print-trail-asserted">
        <h3 className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>Asserted ({section.asserted.length})</h3>
        {section.asserted.length > 0 ? (
          <ul className="m-0 list-disc space-y-1 pl-5">
            {section.asserted.map((entry) => (
              <li key={`${entry.key}:${entry.value}`}>
                {formatAssertedTrailLine(entry)}
                {typeof entry.responderLabel === "string" && entry.responderLabel.length > 0
                  ? ` — ${entry.responderLabel}`
                  : entry.responderLabel === null || entry.responderLabel === undefined
                    ? " — Responder was not stored."
                    : " — Responder was stored empty."}
                {typeof entry.questionId === "string" && entry.questionId.length > 0
                  ? ` — Question id: ${entry.questionId}`
                  : entry.questionId === null || entry.questionId === undefined
                    ? " — Question id was not stored."
                    : " — Question id was stored empty."}
                {typeof entry.recordedUtc === "string" && entry.recordedUtc.length > 0
                  ? ` — Answer recorded time: ${entry.recordedUtc}`
                  : entry.recordedUtc === null || entry.recordedUtc === undefined
                    ? " — Answer recorded time was not stored."
                    : " — Answer recorded time was stored empty."}
              </li>
            ))}
          </ul>
        ) : (
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            Asserted entries were stored empty.
          </p>
        )}
      </div>

      <div className="space-y-2" data-testid="package-print-trail-inferred">
        <h3 className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>Inferred ({section.inferred.length})</h3>
        {section.inferred.length > 0 ? (
          <ul className="m-0 list-disc space-y-1 pl-5">
            {section.inferred.map((entry) => (
              <li key={`${entry.key}:${entry.value}`}>{formatInferredTrailEntryLabel(entry)}</li>
            ))}
          </ul>
        ) : (
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            Inferred entries were stored empty.
          </p>
        )}
      </div>

      <div className="space-y-2" data-testid="package-print-trail-skipped">
        {mustSkipped.length > 0 ? (
          <>
            <h3 className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>Skipped MUST questions ({mustSkipped.length})</h3>
            <ul className="m-0 list-disc space-y-1 pl-5">
              {mustSkipped.map((entry, index) => (
                <li key={`${entry.questionKey ?? "missing"}-${index}`}>{formatSkippedTrailExportLine(entry)}</li>
              ))}
            </ul>
          </>
        ) : (
          <>
            <h3 className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>Skipped MUST questions (0)</h3>
            <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              Skipped MUST questions were stored empty.
            </p>
          </>
        )}
        {shouldSkipped.length > 0 ? (
          <>
            <h3 className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
              Skipped SHOULD questions ({shouldSkipped.length})
            </h3>
            <ul className="m-0 list-disc space-y-1 pl-5">
              {shouldSkipped.map((entry, index) => (
                <li key={`${entry.questionKey ?? "missing"}-should-${index}`}>
                  {formatSkippedTrailExportLine(entry)}
                </li>
              ))}
            </ul>
          </>
        ) : (
          <>
            <h3 className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>Skipped SHOULD questions (0)</h3>
            <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              Skipped SHOULD questions were stored empty.
            </p>
          </>
        )}
      </div>

      <div className="space-y-2" data-testid="package-print-trail-working-open-questions">
        <h3 className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>{OPEN_QUESTIONS_WORKING_DOCUMENT_EXPORT_HEADING}</h3>
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {OPEN_QUESTIONS_WORKING_DOCUMENT_HONESTY_LABEL} — not asserted intake unless confirmed through the trail.
        </p>
        {section.workingDocumentOpenQuestions.length > 0 ? (
          <ul className="m-0 list-disc space-y-1 pl-5">
            {section.workingDocumentOpenQuestions.map((entry) => (
              <li key={`${entry.key}:${entry.value}`}>
                {entry.key}: {entry.value}
              </li>
            ))}
          </ul>
        ) : (
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            {ARCHITECTURE_IDENTITY_DESK_OPEN_QUESTIONS_NOT_STORED}
          </p>
        )}
      </div>
    </section>
  );
}
