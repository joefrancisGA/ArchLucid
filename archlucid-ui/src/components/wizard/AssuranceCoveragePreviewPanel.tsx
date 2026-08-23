"use client";
import { cn } from "@/lib/utils";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { useEffect, useMemo, useState } from "react";

import { StatusTag } from "@/components/ui/status-tag";
import {
  postCoveragePreview,
  type CoveragePreviewResponse,
} from "@/lib/api/coverage-preview-api";
import {
  COVERAGE_PREVIEW_GROUP_LABELS,
  buildCoveragePreviewRequest,
  formatCoveragePreviewScopeNote,
  groupCoveragePreviewAssignments,
  type CoveragePreviewGroupKey,
} from "@/lib/coverage-preview";

const GROUP_ORDER: readonly CoveragePreviewGroupKey[] = [
  "baseline",
  "organizationRequired",
  "platformOverlay",
  "contextualRecommended",
  "additionalOptional",
];

export type AssuranceCoveragePreviewPanelProps = {
  readonly cloudProvider: string;
  readonly focusedPilotModeEnabled: boolean;
  readonly securityIntakeAnswer?: string;
  readonly descriptionText?: string;
  readonly className?: string;
  readonly testId?: string;
};

export function AssuranceCoveragePreviewPanel(props: AssuranceCoveragePreviewPanelProps): React.JSX.Element {
  const testId = props.testId ?? "assurance-coverage-preview";
  const [preview, setPreview] = useState<CoveragePreviewResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const requestBody = useMemo(
    () =>
      buildCoveragePreviewRequest({
        cloudProvider: props.cloudProvider,
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

  useEffect(() => {
    let canceled = false;
    setLoading(true);

    void postCoveragePreview(requestBody)
      .then((response) => {
        if (!canceled) {
          setPreview(response);
          setError(null);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!canceled) {
          setPreview(null);
          setError("Coverage preview unavailable.");
          setLoading(false);
        }
      });

    return () => {
      canceled = true;
    };
  }, [requestBody]);

  if (loading) {
    return (
      <p
        className={cn("m-0 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
        data-testid={`${testId}-loading`}
      >
        Loading assurance coverage preview…
      </p>
    );
  }

  if (error !== null) {
    return (
      <div
        role="status"
        className={cn(DESIGN_TOKENS.callout.warn, OPERATOR_TYPOGRAPHY.body)}
        data-testid={`${testId}-error`}
      >
        {error}
      </div>
    );
  }

  if (preview === null) {
    return (
      <p className={cn("m-0 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)} data-testid={testId}>
        No coverage preview available.
      </p>
    );
  }

  const groups = groupCoveragePreviewAssignments(preview.assignments);

  return (
    <section
      className={cn("space-y-4 rounded-md border border-neutral-200 p-3 dark:border-neutral-700", props.className)}
      data-testid={testId}
      aria-labelledby={`${testId}-heading`}
    >
      <div className="space-y-1">
        <h3
          id={`${testId}-heading`}
          className={cn("m-0 font-semibold text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.cardTitle)}
        >
          Assurance coverage preview
        </h3>
        <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
          {preview.summaryLine}
        </p>
        <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
          {formatCoveragePreviewScopeNote(preview)}
        </p>
      </div>

      {GROUP_ORDER.map((groupKey) => {
        const rows = groups[groupKey];

        if (rows.length === 0) {
          return null;
        }

        return (
          <div key={groupKey} className="space-y-2" data-testid={`${testId}-group-${groupKey}`}>
            <p className={cn("m-0 font-medium text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.helper)}>
              {COVERAGE_PREVIEW_GROUP_LABELS[groupKey]}
            </p>
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {rows.map((row) => (
                <li
                  key={`${row.policyPackId}-${row.coverageType}`}
                  className="rounded-md border border-neutral-200 px-3 py-2 dark:border-neutral-700"
                  data-testid={`${testId}-row-${row.policyPackId}`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={cn("font-medium text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}>
                      {row.policyPackDisplayName}
                    </span>
                    <StatusTag
                      kind={row.includedInRunEvaluation ? "ready" : "neutral"}
                      label={row.includedInRunEvaluation ? "In this review" : "Not in this review"}
                    />
                    {row.recommendationConfidence ? (
                      <StatusTag kind="needs-attention" label={`${row.recommendationConfidence} confidence`} />
                    ) : null}
                  </div>
                  {row.recommendationRationale ? (
                    <p className={cn("m-0 mt-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                      {row.recommendationRationale}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </section>
  );
}
