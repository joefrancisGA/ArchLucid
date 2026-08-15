import { getArchitectureRequest, getRunDetail } from "@/lib/api";
import { ARCHITECTURE_DRAFT_UNKNOWN_CONFIRM_LABEL } from "@/lib/architecture/architecture-draft-structured-brief";
import { coerceRunDetail } from "@/lib/operator/operator-response-guards";

function mergeUniqueAssumptionTexts(existing: readonly string[], incoming: readonly string[]): string[] {
  const seen = new Set(existing.map((value) => value.trim().toLowerCase()).filter((value) => value.length > 0));
  const merged = [...existing];

  for (const raw of incoming) {
    const assumption = raw.trim();

    if (assumption.length === 0) {
      continue;
    }

    const key = assumption.toLowerCase();

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    merged.push(assumption);
  }

  return merged;
}

/** Best-effort load of architecture-request assumptions for review assumption strip (TB-2314). */
export async function tryLoadRequestAssumptionsForRun(runId: string): Promise<readonly string[]> {
  try {
    const detailEnvelope = await getRunDetail(runId.trim());
    const coercedDetail = coerceRunDetail(detailEnvelope.data);

    if (!coercedDetail.ok) {
      return [];
    }

    const requestId = coercedDetail.value.run.architectureRequestId?.trim() ?? "";

    if (requestId.length === 0) {
      return [];
    }

    const request = await getArchitectureRequest(requestId);
    const fromAssumptions = (request.assumptions ?? [])
      .map((assumption) => assumption.trim())
      .filter((assumption) => assumption.length > 0);

    const unknownConstraintLabels = (request.constraints ?? [])
      .map((constraint) => constraint.trim())
      .filter(
        (constraint) =>
          constraint.length > 0 && constraint.includes(ARCHITECTURE_DRAFT_UNKNOWN_CONFIRM_LABEL),
      );

    return mergeUniqueAssumptionTexts(fromAssumptions, unknownConstraintLabels);
  } catch {
    return [];
  }
}
