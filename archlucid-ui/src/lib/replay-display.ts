import {
  REPLAY_VALIDATION_MODES,
  replayValidationModeDefinition,
} from "@/lib/replay-validation-workflow";

/** Backward-compatible re-exports for replay validation display helpers. */
export {
  REPLAY_VALIDATION_MODES,
  deriveReplayValidationOutcome,
  formatReplayDurationLabel,
  isReplayValidationModeId,
  replayValidationActionLabel,
  replayValidationModeDefinition,
  replayValidationOutcomeLabel,
  sortReplayNotes,
} from "@/lib/replay-validation-workflow";

export type {
  ReplayAiUsageLevel,
  ReplayValidationHistoryEntry,
  ReplayValidationModeDefinition,
  ReplayValidationModeId,
  ReplayValidationOutcome,
} from "@/lib/replay-validation-workflow";

/** @deprecated Use replayValidationModeDefinition instead. */
export function replayModeLabel(mode: string): string {
  return replayValidationModeDefinition(mode).summary;
}

/** @deprecated Use REPLAY_VALIDATION_MODES titles instead. */
export function replayModeShortLabel(mode: string): string {
  return replayValidationModeDefinition(mode).title;
}

/** @deprecated Use REPLAY_VALIDATION_MODES for select options. */
export const REPLAY_MODE_PLAIN_OPTIONS = REPLAY_VALIDATION_MODES.map((row) => ({
  mode: row.mode,
  label: row.title,
}));
