"use client";

import Link from "next/link";
import { useEffect } from "react";

import { AskRunIdPicker } from "@/components/AskRunIdPicker";
import { Button } from "@/components/ui/button";
import { useWorkspaceActiveRun } from "@/components/WorkspaceActiveRunContext";
import { reviewDetailPath } from "@/lib/architecture/architecture-routes";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { ImpactPreviewBaselineOption } from "@/lib/impact-preview-page-types";
import { cn } from "@/lib/utils";

export type ImpactPreviewBaselinePickerStripProps = {
  readonly baselineOptions: readonly ImpactPreviewBaselineOption[];
  readonly selectedBaselineId: string | null;
  readonly onSelectBaseline: (baselineId: string) => void;
};

/** Compact baseline review picker before impact preview charts load. */
export function ImpactPreviewBaselinePickerStrip(
  props: ImpactPreviewBaselinePickerStripProps,
): React.JSX.Element | null {
  const workspaceRun = useWorkspaceActiveRun();

  if (props.baselineOptions.length === 0) {
    return null;
  }

  const latestFinalizedRunId = props.baselineOptions[0]?.runId ?? null;
  const workspaceRunId = workspaceRun?.activeRunId?.trim() ?? "";
  const workspaceBaselineAvailable =
    workspaceRunId.length > 0 && props.baselineOptions.some((option) => option.runId === workspaceRunId);
  const pickerValue = props.selectedBaselineId ?? (workspaceBaselineAvailable ? workspaceRunId : "");

  useEffect(() => {
    if (props.selectedBaselineId !== null) {
      return;
    }

    if (workspaceBaselineAvailable) {
      props.onSelectBaseline(workspaceRunId);

      return;
    }

    if (latestFinalizedRunId !== null) {
      props.onSelectBaseline(latestFinalizedRunId);
    }
  }, [
    latestFinalizedRunId,
    props.onSelectBaseline,
    props.selectedBaselineId,
    workspaceBaselineAvailable,
    workspaceRunId,
  ]);

  return (
    <section
      aria-labelledby="impact-preview-baseline-picker-heading"
      className="rounded-lg border border-neutral-200 bg-al-surface-raised px-4 py-3 dark:border-neutral-800"
      data-testid="impact-preview-baseline-picker-strip"
    >
      <h2
        id="impact-preview-baseline-picker-heading"
        className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}
      >
        Pick a baseline review
      </h2>
      <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        Impact preview compares proposed changes against a finalized review. Workspace active review is the default
        when available.
      </p>
      <div className="mt-3 flex flex-wrap items-end gap-3">
        <div className="min-w-[16rem] flex-1">
          <AskRunIdPicker
            value={pickerValue}
            onChange={(value) => {
              if (value.trim().length > 0) {
                props.onSelectBaseline(value.trim());
              }
            }}
            selectedThreadId=""
            committedOnly
            preferAutoPick={false}
            autoSelectSyntheticSample={false}
            label="Baseline review"
            fieldId="impact-preview-baseline"
            hideFieldHelper
          />
        </div>
        {latestFinalizedRunId !== null ? (
          <Button type="button" variant="outline" size="sm" asChild data-testid="impact-preview-open-latest-finalized">
            <Link href={reviewDetailPath(latestFinalizedRunId)}>Open latest finalized review</Link>
          </Button>
        ) : null}
      </div>
    </section>
  );
}
