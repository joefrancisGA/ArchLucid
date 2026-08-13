import { apiGet } from "@/lib/api/http";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator/operator-static-demo";
import { SHOWCASE_FINDING_PROVENANCE } from "@/lib/showcase-static-demo";

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
  try {
    const payload = await apiGet<FindingProvenance>(
      `/v1/architecture/review/${encodeURIComponent(runId)}/findings/${encodeURIComponent(findingId)}/provenance`,
    );

    if (payload.steps.length === 0) {
      return null;
    }

    return payload;
  } catch {
    if (isStaticDemoPayloadFallbackEnabled()) {
      return SHOWCASE_FINDING_PROVENANCE[findingId] ?? null;
    }

    return SHOWCASE_FINDING_PROVENANCE[findingId] ?? null;
  }
}
