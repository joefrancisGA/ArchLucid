# TB-096 — wire consumed Azure AI Search into API/Worker Container Apps.

locals {
  azure_search_app_configured = local.enabled && (
    length(trimspace(var.azure_search_endpoint)) > 0 &&
    length(trimspace(var.azure_search_index_name)) > 0
  )

  azure_search_service_configured = local.enabled && length(trimspace(var.azure_search_service_resource_id)) > 0

  azure_search_arm_id = trimspace(var.azure_search_service_resource_id)

  azure_search_arm_parsed = local.azure_search_service_configured ? regex("^/subscriptions/[^/]+/resourceGroups/(?P<rg>[^/]+)/providers/Microsoft\\.Search/searchServices/(?P<name>[^/]+)$", local.azure_search_arm_id) : null

  azure_search_service_name = try(local.azure_search_arm_parsed.name, "")

  azure_search_resource_group_name = try(local.azure_search_arm_parsed.rg, "")
}

data "azurerm_search_service" "search_consumed" {
  count = local.azure_search_service_configured && length(local.azure_search_service_name) > 0 ? 1 : 0

  name                = local.azure_search_service_name
  resource_group_name = local.azure_search_resource_group_name
}

resource "azurerm_role_assignment" "api_search_index_contributor" {
  count = local.azure_search_service_configured ? 1 : 0

  scope                = local.azure_search_arm_id
  role_definition_name = "Search Index Data Contributor"
  principal_id         = azurerm_container_app.api[0].identity[0].principal_id
}

resource "azurerm_role_assignment" "worker_search_index_contributor" {
  count = local.azure_search_service_configured ? 1 : 0

  scope                = local.azure_search_arm_id
  role_definition_name = "Search Index Data Contributor"
  principal_id         = azurerm_container_app.worker[0].identity[0].principal_id
}
