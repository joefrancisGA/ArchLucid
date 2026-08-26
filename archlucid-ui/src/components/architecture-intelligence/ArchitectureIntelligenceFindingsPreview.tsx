"use client";

import Link from "next/link";

import { SeverityTag } from "@/components/ui/severity-tag";
import type { ClosedLoopReasoningResult } from "@/lib/architecture/architecture-intelligence-api";
import {
  countIntegrityPassedFindings,
  listIntegrityPassedFindingPreviews,
} from "@/lib/architecture/architecture-intelligence-findings";
import { buildArchitectureIntelligenceRunHref } from "@/lib/architecture/architecture-intelligence-run-href";
import {
  ARCHITECTURE_INTELLIGENCE_FINDINGS_PREVIEW_HEADING,
  ARCHITECTURE_INTELLIGENCE_FINDINGS_PREVIEW_SHOW_ALL_LABEL,
  ARCHITECTURE_INTELLIGENCE_REFINE_ZERO_FINDINGS_HINT,
} from "@/lib/architecture/architecture-intelligence-refine-next-steps-copy";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type ArchitectureIntelligenceFindingsPreviewProps = {
  readonly result: ClosedLoopReasoningResult;
  readonly testIdPrefix?: string;
  readonly inlineLimit?: number;
};

/** Inline preview of integrity-passed findings after a refine run. */
export function ArchitectureIntelligenceFindingsPreview(
  props: ArchitectureIntelligenceFindingsPreviewProps,
): React.JSX.Element {
  const prefix = props.testIdPrefix ?? "architecture-intelligence-findings";
  const totalPassed = countIntegrityPassedFindings(props.result);
  const previews = listIntegrityPassedFindingPreviews(props.result, props.inlineLimit ?? 3);
  const runId = props.result.runId?.trim() ?? "";
  const showAllHref =
    runId.length > 0 ? buildArchitectureIntelligenceRunHref({ runId, from: "reviews" }) : null;

  return (
    <section className="space-y-2" data-testid={`${prefix}-preview`} aria-labelledby={`${prefix}-heading`}>
      <h3
        id={`${prefix}-heading`}
        className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
      >
        {ARCHITECTURE_INTELLIGENCE_FINDINGS_PREVIEW_HEADING}
      </h3>

      {totalPassed === 0 ? (
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} role="status">
          {ARCHITECTURE_INTELLIGENCE_REFINE_ZERO_FINDINGS_HINT}
        </p>
      ) : (
        <ul className="m-0 list-none space-y-2 p-0">
          {previews.map((finding) => (
            <li
              key={finding.findingId}
              className="rounded-md border border-neutral-200 bg-al-surface-raised p-3 dark:border-neutral-700"
              data-testid={`${prefix}-item-${finding.findingId}`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
                  {finding.title}
                </p>
                <SeverityTag severity={finding.severity} />
              </div>
              {finding.conclusion.length > 0 ? (
                <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                  {finding.conclusion}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {totalPassed > 0 && showAllHref !== null ? (
        <p className="m-0">
          <Link
            href={showAllHref}
            className={cn(OPERATOR_LINK.inline, "font-medium")}
            data-testid={`${prefix}-show-all`}
          >
            {ARCHITECTURE_INTELLIGENCE_FINDINGS_PREVIEW_SHOW_ALL_LABEL}
            {totalPassed > previews.length ? ` (${totalPassed})` : ""}
          </Link>
        </p>
      ) : null}
    </section>
  );
}
