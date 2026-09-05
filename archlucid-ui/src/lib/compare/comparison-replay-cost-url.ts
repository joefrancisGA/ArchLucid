import { COMPARE_TWO_REVIEWS_PATH } from "@/lib/compare-two-reviews-route";
import {
  isReplayValidationModeId,
  type ReplayValidationModeId,
} from "@/lib/replay-validation-workflow";

export const COMPARISON_RECORD_ID_PARAM = "comparisonRecordId";
export const COMPARISON_REPLAY_MODE_PARAM = "replayMode";
export const COMPARISON_REPLAY_PERSIST_PARAM = "persist";
export const COMPARISON_FORMAT_PARAM = "comparisonFormat";

export function parseComparisonRecordIdFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function parseComparisonReplayModeFromSearch(raw: string | null | undefined): ReplayValidationModeId | "" {
  if (raw === null || raw === undefined) {
    return "";
  }

  const trimmed = raw.trim();

  if (!isReplayValidationModeId(trimmed)) {
    return "";
  }

  return trimmed;
}

export function parseComparisonReplayPersistFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function parseComparisonFormatFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function comparisonReplayCostHrefFromSearch(
  currentSearch: string,
  patch: {
    readonly comparisonRecordId?: string;
    readonly replayMode?: ReplayValidationModeId | "";
    readonly persistReplay?: boolean;
    readonly format?: string;
  },
  pathname: string = COMPARE_TWO_REVIEWS_PATH,
): string {
  const params = new URLSearchParams(currentSearch);

  if (patch.comparisonRecordId !== undefined) {
    const trimmed = patch.comparisonRecordId.trim();

    if (trimmed.length === 0) {
      params.delete(COMPARISON_RECORD_ID_PARAM);
    } else {
      params.set(COMPARISON_RECORD_ID_PARAM, trimmed);
    }
  }

  if (patch.replayMode !== undefined) {
    if (patch.replayMode.length === 0) {
      params.delete(COMPARISON_REPLAY_MODE_PARAM);
    } else {
      params.set(COMPARISON_REPLAY_MODE_PARAM, patch.replayMode);
    }
  }

  if (patch.persistReplay !== undefined) {
    if (!patch.persistReplay) {
      params.delete(COMPARISON_REPLAY_PERSIST_PARAM);
    } else {
      params.set(COMPARISON_REPLAY_PERSIST_PARAM, "1");
    }
  }

  if (patch.format !== undefined) {
    const trimmed = patch.format.trim();

    if (trimmed.length === 0) {
      params.delete(COMPARISON_FORMAT_PARAM);
    } else {
      params.set(COMPARISON_FORMAT_PARAM, trimmed);
    }
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
