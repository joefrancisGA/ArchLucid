output "openai_consumption_budget_id" {
  description = "Resource id of the OpenAI / Cognitive Services consumption budget when enable_openai_consumption_budget is true; otherwise null."
  value       = try(azurerm_consumption_budget_resource_group.openai[0].id, null)
}

output "consumed_openai_contract" {
  value = {
    account_resource_id        = trimspace(var.consumed_openai_account_resource_id)
    endpoint                   = trimspace(var.consumed_openai_endpoint)
    chat_deployment_name       = trimspace(var.consumed_openai_chat_deployment_name)
    embedding_deployment_name  = trimspace(var.consumed_openai_embedding_deployment_name)
    expected_location          = trimspace(var.consumed_openai_expected_location)
  }
  description = "TB-093 consumed Azure OpenAI hand-off (echo for operators; wire via terraform-container-apps or deploy/hosted-prod-terraform)."
}
