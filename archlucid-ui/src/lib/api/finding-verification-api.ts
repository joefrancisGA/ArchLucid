import type { components } from "@/lib/api-types/schemas.generated";

import { formatExportSealedManifestAwareApiError } from "@/lib/api/export-sealed-manifest-conflict";
import { findingVerificationMutationBlockedReason } from "@/lib/findings/finding-verification-mutation-blocked-reason";
import { toApiLoadFailure } from "@/lib/api-load-failure";

import { apiPostJson } from "./http";

export type CreateFindingVerificationReportRequest =
  components["schemas"]["CreateFindingVerificationReportRequest"];

export type FindingVerificationReportResponse =
  components["schemas"]["FindingVerificationReportResponse"];

/** Creates an append-only finding verification report for a sealed run package. */
export async function postFindingVerificationReport(
  runId: string,
  request: CreateFindingVerificationReportRequest,
  options?: { readonly async?: boolean },
): Promise<FindingVerificationReportResponse> {
  const asyncQuery = options?.async ? "?async=true" : "";

  try {
    return await apiPostJson<FindingVerificationReportResponse>(
      `/v1/runs/${encodeURIComponent(runId)}/finding-verification${asyncQuery}`,
      request,
    );
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = findingVerificationMutationBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}
