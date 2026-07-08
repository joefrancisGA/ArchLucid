import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const REPO_ROOT = join(process.cwd(), "..");
const KEYVAULT_ROOT = join(REPO_ROOT, "infra", "terraform-keyvault");
const CONTAINER_APPS_ROOT = join(REPO_ROOT, "infra", "terraform-container-apps");

function readRepoFile(relativePath: string): string {
  return readFileSync(join(REPO_ROOT, relativePath), "utf8");
}

describe("terraform keyvault user-assigned workload identity drift guard (TB-656)", () => {
  const workloadIdentities = readFileSync(join(KEYVAULT_ROOT, "workload_identities.tf"), "utf8");
  const workloadRbac = readFileSync(join(KEYVAULT_ROOT, "workload_rbac.tf"), "utf8");
  const keyvaultOutputs = readFileSync(join(KEYVAULT_ROOT, "outputs.tf"), "utf8");
  const containerAppsMain = readFileSync(join(CONTAINER_APPS_ROOT, "main.tf"), "utf8");
  const applySaas = readRepoFile("infra/apply-saas.ps1");

  it("creates API and Worker user-assigned identities in terraform-keyvault", () => {
    expect(workloadIdentities).toContain("TB-656");
    expect(workloadIdentities).toContain('resource "azurerm_user_assigned_identity" "api_keyvault"');
    expect(workloadIdentities).toContain('resource "azurerm_user_assigned_identity" "worker_keyvault"');
  });

  it("grants Key Vault Secrets User to user-assigned principals in workload_rbac.tf", () => {
    expect(workloadRbac).toContain("user_assigned_keyvault_principal_ids");
    expect(workloadRbac).toContain("azurerm_role_assignment");
    expect(workloadRbac).toContain("Key Vault Secrets User");
  });

  it("exports identity wiring outputs for terraform-container-apps", () => {
    expect(keyvaultOutputs).toContain("api_keyvault_user_assigned_identity_id");
    expect(keyvaultOutputs).toContain("worker_keyvault_user_assigned_identity_id");
    expect(keyvaultOutputs).toContain("user_assigned_keyvault_workload_identities_enabled");
  });

  it("attaches Key Vault user-assigned identities on API and Worker container apps", () => {
    expect(containerAppsMain).toContain("api_keyvault_uami_enabled");
    expect(containerAppsMain).toContain("worker_keyvault_uami_enabled");
    expect(containerAppsMain).toContain("AZURE_CLIENT_ID");
    expect(containerAppsMain).toContain("api_keyvault_user_assigned_identity_client_id");
    expect(containerAppsMain).toContain("worker_keyvault_user_assigned_identity_client_id");
  });

  it("skips TB-092 second pass when user-assigned identities are enabled", () => {
    expect(applySaas).toContain("TB-656");
    expect(applySaas).toContain("Get-TerraformKeyVaultUserAssignedWorkloadOutputs");
    expect(applySaas).toContain("Skipping TB-092 Key Vault workload RBAC second pass");
  });
});
