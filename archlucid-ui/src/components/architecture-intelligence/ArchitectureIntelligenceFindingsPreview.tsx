"use client";

import Link from "next/link";

import { SeverityTag } from "@/components/ui/severity-tag";
import type { ClosedLoopReasoningResult } from "@/lib/architecture/architecture-intelligence-api";
import {
  ARCHITECTURE_INTELLIGENCE_FINDING_SEVERITY_NOT_STORED,
  listIntegrityPassedFindingPreviews,
  resolveIntegrityPassedFindingIdsPresence,
} from "@/lib/architecture/architecture-intelligence-findings";
import { buildArchitectureIntelligenceRunHref } from "@/lib/architecture/architecture-intelligence-run-href";
import {
  ARCHITECTURE_INTELLIGENCE_FINDING_COUNT_NOT_STORED,
  ARCHITECTURE_INTELLIGENCE_FINDINGS_PREVIEW_HEADING,
  ARCHITECTURE_INTELLIGENCE_FINDINGS_PREVIEW_REVIEW_LINK_NOT_STORED,
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
  const integrityIdsPresence = resolveIntegrityPassedFindingIdsPresence(props.result);
  const previews = listIntegrityPassedFindingPreviews(props.result, props.inlineLimit ?? 3);
  const runId = props.result.runId?.trim() ?? "";
  const showAllHref =
    runId.length > 0 ? buildArchitectureIntelligenceRunHref({ runId, from: "reviews" }) : null;

  const emptyStateMessage =
    integrityIdsPresence.kind === "omitted"
      ? ARCHITECTURE_INTELLIGENCE_FINDING_COUNT_NOT_STORED
      : integrityIdsPresence.count === 0
        ? ARCHITECTURE_INTELLIGENCE_REFINE_ZERO_FINDINGS_HINT
        : null;

  const showFindingList = emptyStateMessage === null;

  return (
    <section className="space-y-2" data-testid={`${prefix}-preview`} aria-labelledby={`${prefix}-heading`}>
      <h3
        id={`${prefix}-heading`}
        className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
      >
        {ARCHITECTURE_INTELLIGENCE_FINDINGS_PREVIEW_HEADING}
      </h3>

      {emptyStateMessage !== null ? (
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} role="status">
          {emptyStateMessage}
        </p>
      ) : null}

      {showFindingList ? (
        <ul className="m-0 list-none space-y-2 p-0">
          {previews.map((finding, index) => (
            <li
              key={finding.findingId ?? `${prefix}-missing-id-${index}`}
              className="rounded-md border border-neutral-200 bg-al-surface-raised p-3 dark:border-neutral-700"
              data-testid={`${prefix}-item-${finding.findingId ?? `missing-id-${index}`}`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
                  {finding.title}
                </p>
                {finding.severity !== null ? (
                  <SeverityTag severity={finding.severity} />
                ) : (
                  <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                    {ARCHITECTURE_INTELLIGENCE_FINDING_SEVERITY_NOT_STORED}
                  </p>
                )}
              </div>
              <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                {finding.conclusion}
              </p>
              {finding.findingIdIntegrityNote !== null ? (
                <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} role="status">
                  {finding.findingIdIntegrityNote}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      {showFindingList && previews.length > 0 && showAllHref !== null ? (
        <p className="m-0">
          <Link
            href={showAllHref}
            className={cn(OPERATOR_LINK.inline, "font-medium")}
            data-testid={`${prefix}-show-all`}
          >
            {ARCHITECTURE_INTELLIGENCE_FINDINGS_PREVIEW_SHOW_ALL_LABEL}
            {integrityIdsPresence.kind === "stored" && integrityIdsPresence.count > previews.length
              ? ` (${integrityIdsPresence.count})`
              : ""}
          </Link>
        </p>
      ) : null}

      {showFindingList && previews.length > 0 && showAllHref === null ? (
        <p
          className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
          role="status"
          data-testid={`${prefix}-review-link-not-stored`}
        >
          {ARCHITECTURE_INTELLIGENCE_FINDINGS_PREVIEW_REVIEW_LINK_NOT_STORED}
        </p>
      ) : null}
    </section>
  );
}
