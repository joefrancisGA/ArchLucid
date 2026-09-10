import { apiGet, apiPostJson } from "./http";

export type FindingInsightSignalKind = "DidNotThinkOfThat" | "Expected" | "DismissAsChecklist";

export type FindingInsightSignalStatusResponse = {
  readonly kinds: readonly FindingInsightSignalKind[];
};

/** Lists insight signals recorded by the current operator on one finding. */
export async function getFindingInsightSignalStatus(
  runId: string,
  findingId: string,
): Promise<FindingInsightSignalStatusResponse> {
  return apiGet<FindingInsightSignalStatusResponse>(
    `/v1/runs/${encodeURIComponent(runId)}/findings/${encodeURIComponent(findingId)}/insight-signal`,
  );
}

/** Records an append-only insight signal for one finding (ExecuteAuthority). */
export async function postFindingInsightSignal(
  runId: string,
  findingId: string,
  kind: FindingInsightSignalKind = "DidNotThinkOfThat",
): Promise<void> {
  await apiPostJson(
    `/v1/runs/${encodeURIComponent(runId)}/findings/${encodeURIComponent(findingId)}/insight-signal`,
    { kind },
  );
}
