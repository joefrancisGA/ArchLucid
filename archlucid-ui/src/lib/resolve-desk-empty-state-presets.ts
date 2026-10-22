import type { EmptyStateProps } from "@/components/EmptyState";
import type { EnterpriseCompactEmptyStateProps } from "@/components/EnterpriseCompactEmptyState";
import { ARCHITECTURES_NEW_PATH } from "@/lib/architecture/architecture-routes";
import { WORKING_NEW_REVIEW_LABEL } from "@/lib/architecture/architecture-workflow-labels";
import {
  AZURE_REFERENCE_SAMPLE_GRAPH_CTA_LABEL,
  AZURE_REFERENCE_SAMPLE_REVIEW_CTA_LABEL,
  GRAPH_IDLE,
  RUNS_EMPTY,
} from "@/lib/empty-state-presets";
import { RUNS_EMPTY_COMPACT } from "@/lib/enterprise-compact-empty-state-presets-reviews";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

const WORKING_RUNS_EMPTY_DESCRIPTION =
  "Start a review to gather evidence, evaluate findings, record decisions, and produce exports.";

const WORKING_GRAPH_IDLE_DESCRIPTION =
  "Complete a review to generate an evidence graph linking findings to evidence, decisions, and audit records.";

/** Working reviews list empty — one start, no sample hero (CD-02). */
export function resolveRunsEmptyPreset(workingMode: boolean): EmptyStateProps {
  if (!workingMode) {
    return RUNS_EMPTY;
  }

  return {
    ...RUNS_EMPTY,
    description: WORKING_RUNS_EMPTY_DESCRIPTION,
    actions: [{ label: WORKING_NEW_REVIEW_LABEL, href: ARCHITECTURES_NEW_PATH }],
  };
}

/** Working compact reviews empty — one start, no sample hero (CD-02). */
export function resolveRunsEmptyCompactPreset(workingMode: boolean): EnterpriseCompactEmptyStateProps {
  if (!workingMode) {
    return RUNS_EMPTY_COMPACT;
  }

  return {
    ...RUNS_EMPTY_COMPACT,
    description: WORKING_RUNS_EMPTY_DESCRIPTION,
    actions: [{ label: WORKING_NEW_REVIEW_LABEL, href: ARCHITECTURES_NEW_PATH, variant: "primary" }],
  };
}

/** Working graph idle — one start, no sample graph CTA (CD-02). */
export function resolveGraphIdlePreset(workingMode: boolean): EmptyStateProps {
  if (!workingMode) {
    return GRAPH_IDLE;
  }

  return {
    ...GRAPH_IDLE,
    description: WORKING_GRAPH_IDLE_DESCRIPTION,
    actions: [{ label: WORKING_NEW_REVIEW_LABEL, href: ARCHITECTURES_NEW_PATH }],
  };
}

export function emptyStateActionsIncludeShowcaseSample(
  actions: readonly { readonly href: string }[] | undefined,
): boolean {
  if (actions === undefined) {
    return false;
  }

  const sampleMarker = SHOWCASE_STATIC_DEMO_RUN_ID.toLowerCase();

  return actions.some((action) => action.href.toLowerCase().includes(sampleMarker));
}

export {
  AZURE_REFERENCE_SAMPLE_GRAPH_CTA_LABEL,
  AZURE_REFERENCE_SAMPLE_REVIEW_CTA_LABEL,
};
