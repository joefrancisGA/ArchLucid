import { toApiLoadFailure } from "@/lib/api-load-failure";
import { infraEvidenceDiagramsMutationBlockedReason } from "@/lib/infra-evidence/infra-evidence-diagrams-mutation-blocked-reason";
import { formatInfraEvidenceSealedManifestAwareApiError } from "@/lib/infra-evidence/infra-evidence-sealed-manifest-conflict";

export function formatInfraEvidenceDiagramsApiError(error: unknown): string {
  const failure = toApiLoadFailure(error);
  const blockedReason = infraEvidenceDiagramsMutationBlockedReason(failure);

  if (blockedReason !== null) {
    return blockedReason;
  }

  return formatInfraEvidenceSealedManifestAwareApiError(error);
}
