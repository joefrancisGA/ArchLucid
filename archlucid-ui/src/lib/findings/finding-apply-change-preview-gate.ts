import { impactPreviewHref } from "@/lib/impact-preview-route";
import type { FindingDispositionKind } from "@/lib/api/governance-stickiness-api";

const STORAGE_KEY_PREFIX = "archlucid_finding_apply_preview_v1:";

export const FINDING_APPLY_CHANGE_PREVIEW_REQUIRED_MESSAGE =
  "Simulate impact against this review before marking the recommended change as implemented.";

export const FINDING_APPLY_CHANGE_PREVIEW_OVERRIDE_LABEL =
  "Record an override and continue without a completed impact preview";

function storageKey(runId: string, findingId: string): string {
  return `${STORAGE_KEY_PREFIX}${runId.trim().toLowerCase()}:${findingId.trim().toLowerCase()}`;
}

/** True when the disposition means the recommended change is being applied, not residual risk accepted. */
export function isFindingApplyChangeDisposition(disposition: FindingDispositionKind): boolean {
  return disposition === "Remediated";
}

export function findingApplyChangePreviewHref(runId: string, findingId: string): string {
  return impactPreviewHref({
    baselineRunId: runId.trim(),
    findingId: findingId.trim(),
  });
}

export function hasCompletedFindingApplyChangePreview(runId: string, findingId: string): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return window.sessionStorage.getItem(storageKey(runId, findingId)) === "completed";
  } catch {
    return false;
  }
}

export function recordFindingApplyChangePreviewCompleted(runId: string, findingId: string): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(storageKey(runId, findingId), "completed");
  } catch {
    // Session storage can be blocked; the confirm dialog still requires an explicit override.
  }
}

export function readFindingApplyChangePreviewQuery(search: URLSearchParams): {
  readonly baselineRunId: string | null;
  readonly findingId: string | null;
} {
  const baselineRunId = search.get("baselineRunId")?.trim() ?? "";
  const findingId = search.get("findingId")?.trim() ?? "";

  return {
    baselineRunId: baselineRunId.length > 0 ? baselineRunId : null,
    findingId: findingId.length > 0 ? findingId : null,
  };
}

export function canConfirmFindingApplyChange(input: {
  readonly runId: string;
  readonly findingId: string;
  readonly overrideRecorded: boolean;
}): boolean {
  return input.overrideRecorded || hasCompletedFindingApplyChangePreview(input.runId, input.findingId);
}
