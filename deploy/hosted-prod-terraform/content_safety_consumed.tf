# TB-212 — consume platform-owned Azure AI Content Safety (no second production-like account in this root).

locals {
  content_safety_existing_mode = var.content_safety_compose_mode == "existing"

  content_safety_arm_id = trimspace(var.content_safety_existing_resource_id)

  content_safety_arm_parsed = local.content_safety_existing_mode && length(local.content_safety_arm_id) > 0 ? regex("^/subscriptions/[^/]+/resourceGroups/(?P<rg>[^/]+)/providers/Microsoft\\.CognitiveServices/accounts/(?P<name>[^/]+)$", local.content_safety_arm_id) : null

  content_safety_account_id_effective = local.content_safety_existing_mode ? local.content_safety_arm_id : try(azurerm_cognitive_account.content_safety[0].id, "")

  content_safety_endpoint_effective = local.content_safety_existing_mode ? trimspace(var.content_safety_existing_endpoint) : try(azurerm_cognitive_account.content_safety[0].endpoint, "")
}

data "azurerm_cognitive_account" "content_safety_existing" {
  count = local.content_safety_existing_mode && length(try(local.content_safety_arm_parsed.name, "")) > 0 ? 1 : 0

  name                = local.content_safety_arm_parsed.name
  resource_group_name = local.content_safety_arm_parsed.rg
}

locals {
  content_safety_location_effective = local.content_safety_existing_mode && length(data.azurerm_cognitive_account.content_safety_existing) > 0 ? data.azurerm_cognitive_account.content_safety_existing[0].location : var.location
}
