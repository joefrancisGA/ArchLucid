import { apiPostJson } from "./http";
import type { components } from "@/lib/openapi-schemas";

export type PreCommitSyntheticSimulationRequest =
  components["schemas"]["PreCommitSyntheticSimulationRequest"];

export type PreCommitGateResult = components["schemas"]["PreCommitGateResult"];

export async function simulatePreCommitSyntheticFindings(
  body: PreCommitSyntheticSimulationRequest,
): Promise<PreCommitGateResult> {
  return apiPostJson<PreCommitGateResult>("/v1/governance/pre-finalize/simulate", body);
}
