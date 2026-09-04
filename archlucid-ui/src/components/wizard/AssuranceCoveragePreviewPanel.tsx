"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { StatusTag } from "@/components/ui/status-tag";
import {
  buildCoveragePreviewRequest,
  COVERAGE_PREVIEW_GROUP_LABELS,
  formatCoveragePreviewScopeNote,
  groupCoveragePreviewAssignments,
  mapNormalizedCloudProvider,
  type CoveragePreviewGroupKey,
} from "@/lib/coverage-preview";
import {
  postCoveragePreview,
  type CoveragePreviewAssignment,
  type CoveragePreviewResponse,
} from "@/lib/api/coverage-preview-api";
import { OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type AssuranceCoveragePreviewPanelProps = {
  readonly focusedPilotModeEnabled: boolean;
  readonly cloudProvider?: string;
  readonly securityIntakeAnswer?: string;
  readonly descriptionText?: string;
  readonly className?: string;
};

const GROUP_ORDER: readonly CoveragePreviewGroupKey[] = [
  "baseline",
  "organizationRequired",
  "platformOverlay",
  "contextualRecommended",
  "additionalOptional",
];

function renderAssignmentRow(assignment: CoveragePreviewAssignment): React.JSX.Element {
  const included = assignment.includedInRunEvaluation;

  return (
    <li
      key={`${assignment.policyPackId}-${assignment.coverageType}`}
      className="flex flex-wrap items-center justify-between gap-2 rounded border border-neutral-200 px-2 py-1.5 dark:border-neutral-800"
      data-testid={`coverage-preview-row-${assignment.policyPackDisplayName}`}
    >
      <span className="min-w-0 font-medium text-neutral-900 dark:text-neutral-100">
        {assignment.policyPackDisplayName}
      </span>
      <div className="flex flex-wrap items-center gap-2">
        <StatusTag kind={included ? "ready" : "neutral"} label={included ? "Evaluates this run" : "Not in this run"} />
        {assignment.recommendationRationale ? (
          <span className={cn("max-w-md", OPERATOR_TYPOGRAPHY.helper, "text-neutral-600 dark:text-neutral-400")}>
            {assignment.recommendationRationale}
          </span>
        ) : null}
      </div>
    </li>
  );
}

/** Explainable assurance coverage preview from POST /v1/governance/coverage/preview. */
export function AssuranceCoveragePreviewPanel(props: AssuranceCoveragePreviewPanelProps): React.JSX.Element {
  const requestBody = useMemo(
    () =>
      buildCoveragePreviewRequest({
        cloudProvider: mapNormalizedCloudProvider(props.cloudProvider ?? "None"),
        focusedPilotModeEnabled: props.focusedPilotModeEnabled,
        securityIntakeAnswer: props.securityIntakeAnswer,
        descriptionText: props.descriptionText,
      }),
    [
      props.cloudProvider,
      props.focusedPilotModeEnabled,
      props.securityIntakeAnswer,
      props.descriptionText,
    ],
  );

  const previewQuery = useQuery({
    queryKey: ["coverage-preview", requestBody],
    queryFn: () => postCoveragePreview(requestBody),
    staleTime: 30_000,
  });

  const response: CoveragePreviewResponse | undefined = previewQuery.data;
  const groups = groupCoveragePreviewAssignments(response?.assignments ?? []);

  return (
    <section
      className={cn(
        "rounded-md border border-neutral-200 bg-neutral-50/60 p-3 dark:border-neutral-800 dark:bg-neutral-900/30",
        OPERATOR_LAYOUT.sectionStack,
        props.className,
      )}
      data-testid="assurance-coverage-preview-panel"
      aria-live="polite"
    >
      <div>
        <h3 className={cn("m-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>Assurance coverage preview</h3>
        <p className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.helper, "text-neutral-600 dark:text-neutral-400")}>
          {previewQuery.isLoading
            ? "Loading coverage for this workspace…"
            : previewQuery.isError
              ? "Coverage preview is unavailable right now. You can still start the review."
              : response?.summaryLine ?? "Select review scope to preview which standards evaluate this run."}
        </p>
        {response ? (
          <p className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.helper, "text-neutral-600 dark:text-neutral-400")}>
            {formatCoveragePreviewScopeNote(response)}
          </p>
        ) : null}
      </div>

      {response ? (
        <div className={OPERATOR_LAYOUT.sectionStack}>
          {GROUP_ORDER.map((groupKey) => {
            const rows = groups[groupKey];

            if (rows.length === 0) {
              return null;
            }

            return (
              <div key={groupKey} data-testid={`coverage-preview-group-${groupKey}`}>
                <h4 className={cn("m-0 mb-2 text-sm font-semibold text-neutral-800 dark:text-neutral-200")}>
                  {COVERAGE_PREVIEW_GROUP_LABELS[groupKey]}
                </h4>
                <ul className="m-0 flex list-none flex-col gap-1.5 p-0">{rows.map(renderAssignmentRow)}</ul>
              </div>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
