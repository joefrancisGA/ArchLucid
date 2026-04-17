# Entra External ID (CIAM) — trial consumer sign-in (MSA, Google, hosted local accounts).
#
# Microsoft is still rolling first-class Terraform resources for External ID *tenants* and user flows.
# This root therefore stays **declarative-but-thin**: it validates inputs and exports the directory tenant id
# your API needs (`Auth:Trial:ExternalIdTenantId`) while you create the External ID tenant and user flows
# in the Entra admin center (or a follow-on stack using Microsoft Graph / azapi).
#
# Pair with ArchLucid.Api configuration:
# - `Auth:Trial:Modes` includes `MsaExternalId`
# - `Auth:Trial:ExternalIdTenantId` = `external_id_directory_tenant_id` output

locals {
  external_id_wiring_enabled = var.enable_external_id
}

check "trial_external_id_tenant" {
  assert {
    condition     = !var.enable_external_id || length(trimspace(var.external_id_directory_tenant_id)) > 0
    error_message = "When enable_external_id is true, external_id_directory_tenant_id must be a non-empty Entra directory (tenant) id."
  }
}
