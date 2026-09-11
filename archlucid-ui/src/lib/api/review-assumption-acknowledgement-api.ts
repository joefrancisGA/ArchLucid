import { apiGetSealedManifestAware } from "./api-get-sealed-manifest-aware";
import { apiPutJson } from "./http";

/** Server-persisted pre-finalize assumption acknowledgements (TB-2345 item 49). */
export type ReviewAssumptionAcknowledgementDocument = {
  evaluationVersion: string;
  acknowledgedUtc: string;
  actorUserId: string;
  acknowledgedAssumptionIds: string[];
};

function acknowledgementPath(runId: string): string {
  return `/v1/architecture/review/${encodeURIComponent(runId.trim())}/assumptions/acknowledgement`;
}

/** GET /v1/architecture/review/{runId}/assumptions/acknowledgement */
export async function getReviewAssumptionAcknowledgement(
  runId: string,
): Promise<ReviewAssumptionAcknowledgementDocument> {
  return apiGetSealedManifestAware<ReviewAssumptionAcknowledgementDocument>(acknowledgementPath(runId));
}

/** PUT /v1/architecture/review/{runId}/assumptions/acknowledgement — replaces the full acknowledged set. */
export async function putReviewAssumptionAcknowledgement(
  runId: string,
  acknowledgedAssumptionIds: ReadonlySet<string>,
): Promise<ReviewAssumptionAcknowledgementDocument> {
  return apiPutJson<ReviewAssumptionAcknowledgementDocument>(acknowledgementPath(runId), {
    acknowledgedAssumptionIds: [...acknowledgedAssumptionIds],
  });
}
