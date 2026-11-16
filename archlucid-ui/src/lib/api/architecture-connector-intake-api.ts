import type { CreateArchitectureRunRequestPayload } from "./architecture-runs";
import { apiPostJson } from "./http";
import { trimOptionalText, trimRequiredText } from "./api-boundary-normalization";

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
  const source = trimRequiredText(input.source, "source") as ConnectorIntakeSource;
  const terraformShowJson = trimOptionalText(input.terraformShowJson);
  const gitRepositoryUrl = trimOptionalText(input.gitRepositoryUrl);

  if (source === "terraform-show-json" && terraformShowJson === undefined) {
    throw new Error("terraformShowJson is required for terraform-show-json intake.");
  }

  if (source === "git-terraform" && gitRepositoryUrl === undefined) {
    throw new Error("gitRepositoryUrl is required for git-terraform intake.");
  }

  return apiPostJson<ConnectorIntakeArchitectureRequest>("/v1/architecture/connector-intake", {
    source,
    ...(terraformShowJson !== undefined
      ? { terraformShowJson }
      : {}),
    ...(gitRepositoryUrl !== undefined
      ? { gitRepositoryUrl }
      : {}),
    ...(trimOptionalText(input.gitBranch) !== undefined ? { gitBranch: trimOptionalText(input.gitBranch) } : {}),
    ...(trimOptionalText(input.gitTerraformPath) !== undefined
      ? { gitTerraformPath: trimOptionalText(input.gitTerraformPath) }
      : {}),
    ...(trimOptionalText(input.systemName) !== undefined ? { systemName: trimOptionalText(input.systemName) } : {}),
    ...(trimOptionalText(input.description) !== undefined ? { description: trimOptionalText(input.description) } : {}),
  });
}
