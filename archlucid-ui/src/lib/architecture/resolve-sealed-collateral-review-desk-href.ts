import { buildReviewWorkspaceRouteHref } from "@/lib/architecture/review-workspace-route";
import {
  extractArchitectureIdentityIdFromPathname,
} from "@/lib/desk-continuity-preference";
import type { ReviewDetailTabId } from "@/lib/review-detail-workspace-tabs";
import { readRecentPrimaryReviewDeskTarget } from "@/lib/reviews/review-pin-run-url";

export type ResolveSealedCollateralReviewDeskHrefInput = {
  readonly runId: string;
  readonly pathname?: string | null;
  readonly search?: string | null;
  readonly architectureId?: string | null;
  readonly reviewTab?: ReviewDetailTabId | null;
  readonly findingId?: string | null;
  readonly findingIdOnPath?: boolean;
  readonly hash?: string | null;
};

function normalizeOptionalId(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? "";

  return trimmed.length > 0 ? trimmed : null;
}

/** SG-028 — sealed manifest collateral links return to the nested desk when continuity is known. */
export function resolveSealedCollateralReviewDeskHref(
  input: ResolveSealedCollateralReviewDeskHrefInput,
): string {
  const runId = input.runId.trim();
  const fromPath = extractArchitectureIdentityIdFromPathname(input.pathname ?? "", input.search ?? "");
  const recent = readRecentPrimaryReviewDeskTarget();
  const recentArchitectureId =
    recent !== null && recent.primaryRunId === runId ? recent.architectureId : null;
  const architectureId =
    normalizeOptionalId(input.architectureId) ?? fromPath ?? recentArchitectureId;

  return buildReviewWorkspaceRouteHref({
    runId,
    architectureId,
    reviewTab: input.reviewTab,
    findingId: input.findingId,
    findingIdOnPath: input.findingIdOnPath,
    hash: input.hash,
  });
}
