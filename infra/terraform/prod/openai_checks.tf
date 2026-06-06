# TB-093 — consumed Azure OpenAI contract validation (US East pilot default: eastus).

check "openai_existing_requires_contract" {
  assert {
    condition = var.openai_compose_mode != "existing" || (
      length(trimspace(var.openai_existing_resource_id)) > 0 &&
      length(trimspace(var.openai_existing_endpoint)) > 0 &&
      length(trimspace(var.openai_existing_chat_deployment_name)) > 0 &&
      length(trimspace(var.openai_existing_embedding_deployment_name)) > 0
    )
    error_message = "When openai_compose_mode = existing, set openai_existing_resource_id, openai_existing_endpoint, openai_existing_chat_deployment_name, and openai_existing_embedding_deployment_name."
  }
}

check "openai_existing_location_matches_pilot" {
  assert {
    condition = !local.openai_existing_mode || length(data.azurerm_cognitive_account.openai_existing) == 0 || (
      lower(data.azurerm_cognitive_account.openai_existing[0].location) == lower(trimspace(var.openai_expected_location))
    )
    error_message = "Consumed Azure OpenAI account region must match openai_expected_location (production-like pilot default: eastus / US East)."
  }
}

check "openai_create_requires_names" {
  assert {
    condition = var.openai_compose_mode != "create" || (
      var.openai_account_name != null && var.openai_custom_subdomain_name != null
    )
    error_message = "When openai_compose_mode = create, set openai_account_name and openai_custom_subdomain_name (dev/lab only — production-like stacks should use existing)."
  }
}
