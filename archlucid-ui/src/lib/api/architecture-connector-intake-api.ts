import type { CreateArchitectureRunRequestPayload } from "./architecture-runs";
import { apiPostJson } from "./http";

export type ConnectorIntakeSource = "terraform-show-json" | "git-terraform";

export type ConnectorIntakeRequest = {
  source: ConnectorIntakeSource;
  terraformShowJson?: string;
  gitRepositoryUrl?: string;
  gitBranch?: string;
  gitTerraformPath?: string;
  systemName?: string;
  description?: string;
};

export type ConnectorIntakeArchitectureRequest = CreateArchitectureRunRequestPayload & {
  requestId: string;
};

/** POST /v1/architecture/connector-intake — Terraform/Git → wizard-ready request (preview only). */
export async function parseConnectorIntake(
  input: ConnectorIntakeRequest,
): Promise<ConnectorIntakeArchitectureRequest> {
  return apiPostJson<ConnectorIntakeArchitectureRequest>("/v1/architecture/connector-intake", {
    source: input.source,
    terraformShowJson: input.terraformShowJson,
    gitRepositoryUrl: input.gitRepositoryUrl,
    gitBranch: input.gitBranch,
    gitTerraformPath: input.gitTerraformPath,
    systemName: input.systemName,
    description: input.description,
  });
}
