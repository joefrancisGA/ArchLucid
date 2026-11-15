import type { CreateArchitectureRunRequestPayload } from "./architecture-runs";
import { apiPostJson } from "./http";
import { trimOptionalText } from "./api-boundary-normalization";

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
    ...(trimOptionalText(input.terraformShowJson) !== undefined
      ? { terraformShowJson: trimOptionalText(input.terraformShowJson) }
      : {}),
    ...(trimOptionalText(input.gitRepositoryUrl) !== undefined
      ? { gitRepositoryUrl: trimOptionalText(input.gitRepositoryUrl) }
      : {}),
    ...(trimOptionalText(input.gitBranch) !== undefined ? { gitBranch: trimOptionalText(input.gitBranch) } : {}),
    ...(trimOptionalText(input.gitTerraformPath) !== undefined
      ? { gitTerraformPath: trimOptionalText(input.gitTerraformPath) }
      : {}),
    ...(trimOptionalText(input.systemName) !== undefined ? { systemName: trimOptionalText(input.systemName) } : {}),
    ...(trimOptionalText(input.description) !== undefined ? { description: trimOptionalText(input.description) } : {}),
  });
}
