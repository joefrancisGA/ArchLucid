# TB-093 — wire consumed Azure OpenAI into API/Worker Container Apps (TB-080 managed identity).

locals {
  azure_openai_app_configured = local.enabled && (
    length(trimspace(var.azure_openai_endpoint)) > 0 &&
    length(trimspace(var.azure_openai_chat_deployment_name)) > 0 &&
    length(trimspace(var.azure_openai_embedding_deployment_name)) > 0
  )

  azure_openai_account_configured = local.enabled && length(trimspace(var.azure_openai_account_resource_id)) > 0

  azure_openai_arm_id = trimspace(var.azure_openai_account_resource_id)

  azure_openai_arm_parsed = local.azure_openai_account_configured ? regex("^/subscriptions/[^/]+/resourceGroups/(?P<rg>[^/]+)/providers/Microsoft\\.CognitiveServices/accounts/(?P<name>[^/]+)$", local.azure_openai_arm_id) : null

  azure_openai_account_name = try(local.azure_openai_arm_parsed.name, "")

  azure_openai_resource_group_name = try(local.azure_openai_arm_parsed.rg, "")
}

data "azurerm_cognitive_account" "openai_consumed" {
  count = local.azure_openai_account_configured && length(local.azure_openai_account_name) > 0 ? 1 : 0

  name                = local.azure_openai_account_name
  resource_group_name = local.azure_openai_resource_group_name
}

resource "azurerm_role_assignment" "api_openai_user" {
  count = local.azure_openai_account_configured ? 1 : 0

  scope                = local.azure_openai_arm_id
  role_definition_name = "Cognitive Services OpenAI User"
  principal_id         = azurerm_container_app.api[0].identity[0].principal_id
}

resource "azurerm_role_assignment" "worker_openai_user" {
  count = local.azure_openai_account_configured ? 1 : 0

  scope                = local.azure_openai_arm_id
  role_definition_name = "Cognitive Services OpenAI User"
  principal_id         = azurerm_container_app.worker[0].identity[0].principal_id
}
