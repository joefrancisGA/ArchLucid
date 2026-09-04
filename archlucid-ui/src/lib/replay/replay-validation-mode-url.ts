import { INTERNAL_REPLAY_PATH } from "@/lib/internal-ops-route-paths";
import {
  isReplayValidationModeId,
  REPLAY_VALIDATION_MODES,
  type ReplayValidationModeId,
} from "@/lib/replay-validation-workflow";

const DEFAULT_REPLAY_VALIDATION_MODE: ReplayValidationModeId = REPLAY_VALIDATION_MODES[0]!.mode;

export const REPLAY_VALIDATION_MODE_PARAM = "mode";

export function parseReplayValidationModeFromSearch(raw: string | null | undefined): ReplayValidationModeId {
  if (raw === null || raw === undefined) {
    return DEFAULT_REPLAY_VALIDATION_MODE;
  }

  const trimmed = raw.trim();

  if (!isReplayValidationModeId(trimmed)) {
    return DEFAULT_REPLAY_VALIDATION_MODE;
  }

  return trimmed;
}

export function replayValidationModeHrefFromSearch(
  currentSearch: string,
  mode: ReplayValidationModeId,
  pathname: string = INTERNAL_REPLAY_PATH,
): string {
  const params = new URLSearchParams(currentSearch);

  if (mode === DEFAULT_REPLAY_VALIDATION_MODE) {
    params.delete(REPLAY_VALIDATION_MODE_PARAM);
  } else {
    params.set(REPLAY_VALIDATION_MODE_PARAM, mode);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
