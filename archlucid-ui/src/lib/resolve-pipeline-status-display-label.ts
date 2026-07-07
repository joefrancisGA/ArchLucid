import { isBuyerVocabularyPassActive } from "@/lib/demo-ui-env";
import {
  PIPELINE_STATUS_BUYER_LABEL_BY_INTERNAL,
  type RunPipelineInternalLabel,
} from "@/lib/pipeline-status-labels";

export type { RunPipelineInternalLabel } from "@/lib/pipeline-status-labels";

/**
 * Maps internal pipeline labels to buyer-facing status copy when the vocabulary pass is active (TB-651).
 * Internal labels are unchanged for grouping logic and full-operator diagnostics.
 */
export function resolvePipelineStatusDisplayLabel(
  internalLabel: RunPipelineInternalLabel,
  vocabularyPassActive: boolean = isBuyerVocabularyPassActive(),
): string {
  if (!vocabularyPassActive) {
    return internalLabel;
  }

  // Runtime fallback to the internal label guards against unmapped values reaching this
  // function from loosely-typed callers; the map itself is compile-time exhaustive.
  return PIPELINE_STATUS_BUYER_LABEL_BY_INTERNAL[internalLabel] ?? internalLabel;
}

/** Aria prefix for pipeline status pills — shorter when buyer vocabulary is active. */
export function resolvePipelineStatusAriaPrefix(
  vocabularyPassActive: boolean = isBuyerVocabularyPassActive(),
): string {
  if (vocabularyPassActive) {
    return "Review status";
  }

  return "Architecture review pipeline status";
}
