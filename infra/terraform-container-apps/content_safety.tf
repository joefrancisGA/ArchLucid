# Azure AI Content Safety for production-like API hosts (Staging/Production require Endpoint + ApiKey).
# Owns the Cognitive Services account in this resource group. Container App env/secret wiring for the
# key is CD-owned on ArchLucid DEV (GitHub Environment secrets ARCHLUCID_CONTENT_SAFETY_*), so Terraform
# apply does not fight az containerapp secret rotation.
#
# Brownfield (account already created outside state):
#   terraform import 'azurerm_cognitive_account.content_safety[0]' \
#     /subscriptions/<sub>/resourceGroups/<rg>/providers/Microsoft.CognitiveServices/accounts/<name>

locals {
  content_safety_account_enabled = local.enabled && var.enable_content_safety_account
}

resource "azurerm_cognitive_account" "content_safety" {
  count = local.content_safety_account_enabled ? 1 : 0

  name                  = var.content_safety_account_name
  location              = length(trimspace(var.content_safety_location)) > 0 ? var.content_safety_location : local.azure_location
  resource_group_name   = local.resource_group_name
  kind                  = "ContentSafety"
  sku_name              = var.content_safety_sku_name
  custom_subdomain_name = var.content_safety_custom_subdomain_name
  tags                  = local.merged_tags

  public_network_access_enabled = var.content_safety_public_network_access_enabled
}
