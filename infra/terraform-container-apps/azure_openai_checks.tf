check "azure_openai_app_config_contract" {
  assert {
    condition = !local.enabled || length(trimspace(var.azure_openai_endpoint)) == 0 || (
      length(trimspace(var.azure_openai_chat_deployment_name)) > 0 &&
      length(trimspace(var.azure_openai_embedding_deployment_name)) > 0
    )
    error_message = "When azure_openai_endpoint is set, also set azure_openai_chat_deployment_name and azure_openai_embedding_deployment_name."
  }
}

check "azure_openai_consumed_location" {
  assert {
    condition = !local.azure_openai_account_configured || length(data.azurerm_cognitive_account.openai_consumed) == 0 || (
      lower(data.azurerm_cognitive_account.openai_consumed[0].location) == lower(trimspace(var.azure_openai_expected_location))
    )
    error_message = "Consumed Azure OpenAI account region must match azure_openai_expected_location (pilot default: eastus)."
  }
}
