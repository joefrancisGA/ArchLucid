# TB-096 — consume platform-owned Azure AI Search (no second production-like service in this root).

locals {
  search_existing_mode = var.search_compose_mode == "existing"

  search_arm_id = trimspace(coalesce(var.search_existing_resource_id, ""))

  search_arm_parsed = local.search_existing_mode && length(local.search_arm_id) > 0 ? regex("^/subscriptions/[^/]+/resourceGroups/(?P<rg>[^/]+)/providers/Microsoft\\.Search/searchServices/(?P<name>[^/]+)$", local.search_arm_id) : null

  search_service_id_effective = local.search_existing_mode ? local.search_arm_id : try(azurerm_search_service.search[0].id, "")

  search_endpoint_effective = local.search_existing_mode ? trimspace(var.search_existing_endpoint) : (
    var.search_compose_mode == "create" ? "https://${azurerm_search_service.search[0].name}.search.windows.net" : ""
  )

  search_index_name_effective = trimspace(coalesce(var.search_index_name, ""))

  search_semantic_configuration_effective = trimspace(coalesce(var.search_semantic_configuration_name, ""))
}

data "azurerm_search_service" "search_existing" {
  count = local.search_existing_mode && length(try(local.search_arm_parsed.name, "")) > 0 ? 1 : 0

  name                = local.search_arm_parsed.name
  resource_group_name = local.search_arm_parsed.rg
}