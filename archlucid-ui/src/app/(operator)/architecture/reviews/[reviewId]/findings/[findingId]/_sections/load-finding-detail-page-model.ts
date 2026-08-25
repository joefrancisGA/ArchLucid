import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import {
  findingDetailHeadingTitleForRoute,
  isPhiMinimizationFindingId,
  isPhiMinimizationSampleFinding,
} from "@/lib/findings/finding-display-from-inspect";
import { findingLinkedManifestDetailHrefForRun } from "@/lib/findings/finding-linked-manifest-href";
import { shouldTreatFindingInspectFailureAsNotFound } from "@/lib/load-finding-inspect-for-route";
import { loadFindingInspectForRouteCached } from "@/lib/load-finding-inspect-for-route-cached";
import { resolveNextFindingInReviewForRunDetail } from "@/lib/findings/resolve-next-finding-in-review";
import { fetchRunDetailCriticalPageBundle } from "@/lib/fetch-run-detail-page-bundle-client";
import { tryLoadRunExecutionFootnote } from "@/lib/try-load-run-execution-footnote";
import { tryLoadStatedConstraintContextForRun } from "@/lib/try-load-stated-constraint-context";
import type { FindingInspectPayload } from "@/types/finding-inspect";

import type { FindingDetailPageModel } from "./finding-detail-page-model";

export type LoadFindingDetailPageModelResult =
  | { kind: "not-found" }
  | { kind: "success"; model: FindingDetailPageModel };

/**
 * Loads finding inspect payload and run footer for the finding detail route (after dynamic params are validated).
 *
 * @param findingIdRouteParam Raw route segment for `findingId` (e.g. for audit panels that mirror the URL).
 */
export async function loadFindingDetailPageModel(
  runId: string,
  decodedFindingId: string,
  findingIdRouteParam: string,
): Promise<LoadFindingDetailPageModelResult> {
  // Detail first paint: omit PayloadJson LOB; title/rationale still projected for narrative (TB-931).
  // Cached so generateMetadata on the same request reuses this inspect (no second API call).
  const [inspectResult, runExecutionFootnote, statedConstraintContext, criticalBundle] = await Promise.all([
    loadFindingInspectForRouteCached(runId, decodedFindingId, false),
    tryLoadRunExecutionFootnote(runId),
    tryLoadStatedConstraintContextForRun(runId),
    fetchRunDetailCriticalPageBundle(runId).catch(() => null),
  ]);

  const { payload: inspectPayloadRaw, failure: inspectFailureRaw, invalidRouteAlignment } =
    inspectResult;

  if (invalidRouteAlignment || shouldTreatFindingInspectFailureAsNotFound(inspectFailureRaw)) {
    return { kind: "not-found" };
  }

  const inspectPayload: FindingInspectPayload | null = inspectPayloadRaw;
  const inspectFailure = inspectFailureRaw;

  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const linkedManifestHref = findingLinkedManifestDetailHrefForRun(runId);
  const pageTitle = findingDetailHeadingTitleForRoute(decodedFindingId, inspectPayload);
  const findingIsPhi =
    inspectPayload !== null
      ? isPhiMinimizationSampleFinding(inspectPayload)
      : isPhiMinimizationFindingId(decodedFindingId);

  const nextFindingInReview =
    criticalBundle?.data.buyerSummary !== undefined && criticalBundle.data.buyerSummary !== null
      ? resolveNextFindingInReviewForRunDetail(criticalBundle.data.buyerSummary, decodedFindingId)
      : null;

  const model: FindingDetailPageModel = {
    runId,
    findingIdRouteParam,
    decodedFindingId,
    inspectPayload,
    inspectFailure,
    buyerPolishedShell,
    linkedManifestHref,
    pageTitle,
    findingIsPhi,
    runExecutionFootnote,
    statedConstraintContext,
    nextFindingInReview,
  };

  return { kind: "success", model };
}
