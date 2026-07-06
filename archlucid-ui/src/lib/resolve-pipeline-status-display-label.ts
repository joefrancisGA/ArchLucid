import { isBuyerVocabularyPassActive } from "@/lib/demo-ui-env";
import {
  PIPELINE_STATUS_BUYER_DISPLAY_LABELS,
  PIPELINE_STATUS_LABELS,
} from "@/lib/i18n";

/** Internal pipeline labels derived from {@link RunSummary} snapshot flags. */
export type RunPipelineInternalLabel =
  | typeof PIPELINE_STATUS_LABELS.finalized
  | typeof PIPELINE_STATUS_LABELS.readyToFinalize
  | typeof PIPELINE_STATUS_LABELS.inPipeline
  | typeof PIPELINE_STATUS_LABELS.starting;

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

  switch (internalLabel) {
    case PIPELINE_STATUS_LABELS.finalized:
      return PIPELINE_STATUS_BUYER_DISPLAY_LABELS.finalized;

    case PIPELINE_STATUS_LABELS.readyToFinalize:
      return PIPELINE_STATUS_BUYER_DISPLAY_LABELS.readyToFinalize;

    case PIPELINE_STATUS_LABELS.inPipeline:
      return PIPELINE_STATUS_BUYER_DISPLAY_LABELS.inPipeline;

    case PIPELINE_STATUS_LABELS.starting:
      return PIPELINE_STATUS_BUYER_DISPLAY_LABELS.starting;

    default: {
      const _exhaustive: never = internalLabel;

      return _exhaustive;
    }
  }
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
