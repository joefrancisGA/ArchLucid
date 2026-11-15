import { apiGetSealedManifestAware } from "@/lib/api/api-get-sealed-manifest-aware";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator/operator-static-demo";
import { SHOWCASE_FINDING_PROVENANCE } from "@/lib/showcase-static-demo";
import { findingProvenanceBlockedReason } from "@/lib/findings/finding-provenance-blocked-reason";
import { isRecord, trimRequiredPathSegment } from "./api-boundary-normalization";

export type FindingProvenanceStepKind = "input" | "evidence" | "policy-check" | "conclusion";

export type FindingProvenanceStep = {
  readonly kind: FindingProvenanceStepKind;
  readonly label: string;
  readonly detail: string;
  readonly timestamp?: string;
};

export type FindingProvenance = {
  readonly findingId: string;
  readonly steps: readonly FindingProvenanceStep[];
};

export async function getFindingProvenance(runId: string, findingId: string): Promise<FindingProvenance | null> {
  const normalizedRunId = trimRequiredPathSegment(runId, "runId");
  const normalizedFindingId = trimRequiredPathSegment(findingId, "findingId");

  try {
    const payload = await apiGetSealedManifestAware<FindingProvenance>(
      `/v1/architecture/review/${encodeURIComponent(normalizedRunId)}/findings/${encodeURIComponent(normalizedFindingId)}/provenance`,
    );

    if (!isRecord(payload) || !Array.isArray(payload.steps)) {
      return null;
    }

    if (payload.steps.length === 0) {
      return null;
    }

    return payload;
  } catch (error: unknown) {
    const blockedReason = findingProvenanceBlockedReason(toApiLoadFailure(error));

    if (blockedReason !== null) {
      throw new Error(blockedReason);
    }

    if (isStaticDemoPayloadFallbackEnabled()) {
      return SHOWCASE_FINDING_PROVENANCE[normalizedFindingId] ?? null;
    }

    throw new Error(toApiLoadFailure(error).message ?? "Finding provenance could not be loaded.");
  }
}
