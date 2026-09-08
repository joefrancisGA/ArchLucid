import type { CloudResourceEvidenceHubResponse } from "@/lib/infra-evidence/infra-evidence-hub-types";

function parseTerraformAddress(terraformAddress: string): { resourceType: string; resourceName: string } | null {
  const trimmed = terraformAddress.trim();
  const dotIndex = trimmed.lastIndexOf(".");

  if (dotIndex <= 0 || dotIndex === trimmed.length - 1) {
    return null;
  }

  return {
    resourceType: trimmed.slice(0, dotIndex),
    resourceName: trimmed.slice(dotIndex + 1),
  };
}

/** Best-effort advisory HCL stub reconstructed from hub metadata — not original Terraform. */
export function buildAdvisoryTerraformResourceSnippet(
  hub: CloudResourceEvidenceHubResponse,
): string | null {
  const terraformAddress = hub.terraformAddress?.trim() ?? "";

  if (terraformAddress.length === 0) {
    return null;
  }

  const parsed = parseTerraformAddress(terraformAddress);

  if (parsed == null) {
    return null;
  }

  const config = hub.currentConfiguration;
  const azureResourceId = config?.azureResourceId?.trim() ?? hub.externalResourceId.trim();
  const resourceGroup = config?.resourceGroup?.trim() ?? "";
  const region = config?.region?.trim() ?? "";
  const snapshotId = config?.snapshotId?.trim() ?? "";

  const lines = [
    "# Advisory reconstruction from inventory evidence — not original Terraform.",
    `# generation_method = ${hub.terraformGenerationMethod ?? "advisory"}`,
    ...(snapshotId.length > 0 ? [`# snapshot_id = ${snapshotId}`] : []),
    `resource "${parsed.resourceType}" "${parsed.resourceName}" {`,
    ...(azureResourceId.length > 0 ? [`  # azure_resource_id = ${azureResourceId}`] : []),
    ...(resourceGroup.length > 0 ? [`  # resource_group_name = ${resourceGroup}`] : []),
    ...(region.length > 0 ? [`  # location = ${region}`] : []),
    "  # properties reconstructed from inventory are omitted in this preview",
    "}",
  ];

  return lines.join("\n");
}
