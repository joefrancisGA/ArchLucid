import { canonicalizeDemoRunId } from "@/lib/demo-run-canonical";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import type { GraphViewModel } from "@/types/graph";

export type AskRunListAvailability = {
  readonly loadError: boolean;
  readonly loading: boolean;
  readonly packageCount: number;
  readonly usingSyntheticSample: boolean;
};

export type GraphReviewPickerState =
  | "loading"
  | "no-packages"
  | "no-selection"
  | "real-review"
  | "sample-review";

/** Whether the active run id is the showcase sample review. */
export function isShowcaseDemoRunId(runId: string): boolean {
  const trimmed = runId.trim();

  if (trimmed.length === 0) {
    return false;
  }

  return canonicalizeDemoRunId(trimmed) === canonicalizeDemoRunId(SHOWCASE_STATIC_DEMO_RUN_ID);
}

/** Sample graph is active when the sample review is selected or only static demo data is available. */
export function isSampleGraphActive(options: {
  readonly runId: string;
  readonly graph: GraphViewModel | null;
  readonly seededProvenanceGraphVm: GraphViewModel | null;
}): boolean {
  if (isShowcaseDemoRunId(options.runId)) {
    return true;
  }

  return options.graph === null && options.seededProvenanceGraphVm !== null;
}

/**
 * Idle empty state is shown only when there is no graph to render — never alongside a populated canvas.
 */
export function shouldShowGraphIdleCard(options: {
  readonly effectiveGraph: GraphViewModel | null;
  readonly loading: boolean;
  readonly loadFailure: unknown;
  readonly malformedMessage: string | null;
  readonly buyerGraphAwaitingSelection: boolean;
  readonly buyerTraceWithoutGraph: boolean;
  readonly reviewsListLoadError: boolean;
}): boolean {
  if (options.effectiveGraph !== null) {
    return false;
  }

  if (options.loading) {
    return false;
  }

  if (options.loadFailure !== null || options.malformedMessage !== null) {
    return false;
  }

  if (options.buyerTraceWithoutGraph) {
    return false;
  }

  if (options.reviewsListLoadError && options.buyerGraphAwaitingSelection) {
    return false;
  }

  return options.buyerGraphAwaitingSelection || options.effectiveGraph === null;
}

/**
 * Buyer shell: show Load only when a real package is selected and the graph is not already
 * loading/present. Prefer auto-load on select; keep the button for first manual load or retry.
 */
export function shouldShowBuyerEvidenceGraphLoadButton(options: {
  readonly reviewPickerState: GraphReviewPickerState;
  readonly runId: string;
  readonly graphLoadRequested: boolean;
  readonly effectiveGraph: GraphViewModel | null;
  readonly loading?: boolean;
  readonly loadFailure?: unknown;
}): boolean {
  if (options.reviewPickerState !== "real-review") {
    return false;
  }

  if (options.runId.trim().length === 0) {
    return false;
  }

  if (options.effectiveGraph !== null) {
    return false;
  }

  if (options.loadFailure != null) {
    return true;
  }

  if (options.loading === true) {
    return false;
  }

  return !options.graphLoadRequested;
}

export function resolveGraphReviewPickerState(
  availability: AskRunListAvailability,
  runId: string,
): GraphReviewPickerState {
  if (availability.loading) {
    return "loading";
  }

  if (isShowcaseDemoRunId(runId)) {
    return "sample-review";
  }

  if (runId.trim().length > 0) {
    return "real-review";
  }

  if (availability.packageCount === 0 && !availability.loadError) {
    return "no-packages";
  }

  if (availability.usingSyntheticSample) {
    return "sample-review";
  }

  return "no-selection";
}
