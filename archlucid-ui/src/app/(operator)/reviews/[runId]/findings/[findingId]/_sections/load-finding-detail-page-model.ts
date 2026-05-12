import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import {
  findingDetailHeadingTitleForRoute,
  isPhiMinimizationFindingId,
  isPhiMinimizationSampleFinding,
} from "@/lib/finding-display-from-inspect";
import { findingLinkedManifestDetailHrefForRun } from "@/lib/finding-linked-manifest-href";
import {
  loadFindingInspectForRoute,
  shouldTreatFindingInspectFailureAsNotFound,
} from "@/lib/load-finding-inspect-for-route";
import { tryLoadRunExecutionFootnote } from "@/lib/try-load-run-execution-footnote";
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
  const { payload: inspectPayloadRaw, failure: inspectFailureRaw, invalidRouteAlignment } =
    await loadFindingInspectForRoute(runId, decodedFindingId);

  if (invalidRouteAlignment || shouldTreatFindingInspectFailureAsNotFound(inspectFailureRaw)) {
    return { kind: "not-found" };
  }

  const inspectPayload: FindingInspectPayload | null = inspectPayloadRaw;
  const inspectFailure = inspectFailureRaw;

  const runExecutionFootnote = await tryLoadRunExecutionFootnote(runId);
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const linkedManifestHref = findingLinkedManifestDetailHrefForRun(runId);
  const pageTitle = findingDetailHeadingTitleForRoute(decodedFindingId, inspectPayload);
  const findingIsPhi =
    inspectPayload !== null
      ? isPhiMinimizationSampleFinding(inspectPayload)
      : isPhiMinimizationFindingId(decodedFindingId);

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
  };

  return { kind: "success", model };
}
