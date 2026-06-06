# TB-093 — consume a platform-owned Azure OpenAI account (no second production account in this root).

locals {
  openai_existing_mode = var.openai_compose_mode == "existing"

  openai_arm_id = trimspace(var.openai_existing_resource_id)

  openai_arm_parsed = local.openai_existing_mode && length(local.openai_arm_id) > 0 ? regex("^/subscriptions/[^/]+/resourceGroups/(?P<rg>[^/]+)/providers/Microsoft\\.CognitiveServices/accounts/(?P<name>[^/]+)$", local.openai_arm_id) : null

  openai_account_id_effective = local.openai_existing_mode ? local.openai_arm_id : try(azurerm_cognitive_account.openai[0].id, "")

  openai_endpoint_effective = local.openai_existing_mode ? trimspace(var.openai_existing_endpoint) : try(azurerm_cognitive_account.openai[0].endpoint, "")

  openai_chat_deployment_effective = local.openai_existing_mode ? trimspace(var.openai_existing_chat_deployment_name) : (
    var.openai_compose_mode == "create" && var.openai_enable_chat_deployment ? try(azurerm_cognitive_deployment.chat[0].name, "") : ""
  )

  openai_embedding_deployment_effective = local.openai_existing_mode ? trimspace(var.openai_existing_embedding_deployment_name) : (
    var.openai_compose_mode == "create" && var.openai_enable_embedding_deployment ? try(azurerm_cognitive_deployment.embedding[0].name, "") : ""
  )

  openai_workload_principal_ids = distinct(compact([
    for id in var.openai_workload_principal_ids : trimspace(id)
    if length(trimspace(id)) > 0
  ]))
}

data "azurerm_cognitive_account" "openai_existing" {
  count = local.openai_existing_mode && length(try(local.openai_arm_parsed.name, "")) > 0 ? 1 : 0

  name                = local.openai_arm_parsed.name
  resource_group_name = local.openai_arm_parsed.rg
}

locals {
  openai_location_effective = local.openai_existing_mode && length(data.azurerm_cognitive_account.openai_existing) > 0 ? data.azurerm_cognitive_account.openai_existing[0].location : var.location
}
