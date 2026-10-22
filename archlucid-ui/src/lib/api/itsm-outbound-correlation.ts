import { apiGet } from "@/lib/api-client";
import type { components } from "@/lib/openapi-schemas";

export type ItsmFindingCorrelationListItem = components["schemas"]["ItsmFindingCorrelationListItem"];
export type ItsmFindingCorrelationsByFindingResponse =
  components["schemas"]["ItsmFindingCorrelationsByFindingResponse"];

export type ItsmFindingCorrelationsBatchResponse = {
  findings?: Array<{
    findingId?: string;
    correlations?: ItsmFindingCorrelationListItem[];
  }>;
};

export async function listItsmFindingCorrelations(
  findingId: string,
): Promise<ItsmFindingCorrelationsByFindingResponse> {
  const q = new URLSearchParams();
  q.set("findingId", findingId);

  return apiGet<ItsmFindingCorrelationsByFindingResponse>(
    `/v1/integrations/itsm/correlations?${q}`,
  );
}

export async function listItsmFindingCorrelationsBatch(
  findingIds: readonly string[],
): Promise<ItsmFindingCorrelationsBatchResponse> {
  const q = new URLSearchParams();

  for (const findingId of findingIds) {
    if (findingId.trim().length === 0) {
      continue;
    }

    q.append("findingIds", findingId.trim());
  }

  return apiGet<ItsmFindingCorrelationsBatchResponse>(
    `/v1/integrations/itsm/correlations/batch?${q}`,
  );
}
