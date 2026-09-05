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
import {
  findCoveragePackOverride,
  isCoveragePreviewAssignmentExcludable,
  type CoveragePackOverride,
} from "@/lib/coverage-pack-overrides";
import { OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type AssuranceCoveragePreviewPanelProps = {
  readonly focusedPilotModeEnabled: boolean;
  readonly cloudProvider?: string;
  readonly securityIntakeAnswer?: string;
  readonly descriptionText?: string;
  readonly packOverrides: readonly CoveragePackOverride[];
  readonly onPackOverrideChange: (override: CoveragePackOverride) => void;
  readonly overrideValidationMessage?: string | null;
  readonly className?: string;
};

const GROUP_ORDER: readonly CoveragePreviewGroupKey[] = [
  "baseline",
  "organizationRequired",
  "platformOverlay",
  "contextualRecommended",
  "additionalOptional",
];

function renderAssignmentRow(
  assignment: CoveragePreviewAssignment,
  packOverrides: readonly CoveragePackOverride[],
  onPackOverrideChange: (override: CoveragePackOverride) => void,
): React.JSX.Element {
  const override = findCoveragePackOverride(packOverrides, assignment.policyPackId);
  const isExcluded = override?.excluded === true;
  const included = assignment.includedInRunEvaluation && !isExcluded;
  const canExclude = isCoveragePreviewAssignmentExcludable(assignment);

  return (
    <li
      key={`${assignment.policyPackId}-${assignment.coverageType}`}
      className="flex flex-col gap-2 rounded border border-neutral-200 px-2 py-1.5 dark:border-neutral-800"
      data-testid={`coverage-preview-row-${assignment.policyPackDisplayName}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
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
      </div>

      {canExclude ? (
        <div className="flex flex-col gap-1.5 border-t border-neutral-200 pt-2 dark:border-neutral-800">
          <label className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
            <input
              type="checkbox"
              checked={isExcluded}
              onChange={(event) => {
                onPackOverrideChange({
                  policyPackId: assignment.policyPackId,
                  excluded: event.target.checked,
                  exclusionReason: override?.exclusionReason ?? "",
                });
              }}
              data-testid={`coverage-preview-exclude-${assignment.policyPackId}`}
            />
            Exclude from this review
          </label>
          {isExcluded ? (
            <label className="flex flex-col gap-1">
              <span className={cn(OPERATOR_TYPOGRAPHY.helper, "text-neutral-600 dark:text-neutral-400")}>
                Why is this pack out of scope?
              </span>
              <input
                type="text"
                value={override?.exclusionReason ?? ""}
                onChange={(event) => {
                  onPackOverrideChange({
                    policyPackId: assignment.policyPackId,
                    excluded: true,
                    exclusionReason: event.target.value,
                  });
                }}
                placeholder="Short reason for procurement and audit trail"
                className="rounded border border-neutral-300 bg-white px-2 py-1 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
                data-testid={`coverage-preview-exclude-reason-${assignment.policyPackId}`}
              />
            </label>
          ) : null}
        </div>
      ) : null}
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
        userOverrides: props.packOverrides,
      }),
    [
      props.cloudProvider,
      props.focusedPilotModeEnabled,
      props.securityIntakeAnswer,
      props.descriptionText,
      props.packOverrides,
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
        {props.overrideValidationMessage ? (
          <p
            className={cn("m-0 mt-1 text-amber-900 dark:text-amber-100", OPERATOR_TYPOGRAPHY.helper)}
            data-testid="coverage-preview-override-validation"
          >
            {props.overrideValidationMessage}
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
                <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
                  {rows.map((assignment) =>
                    renderAssignmentRow(assignment, props.packOverrides, props.onPackOverrideChange),
                  )}
                </ul>
              </div>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
