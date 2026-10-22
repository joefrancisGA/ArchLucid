# TB-212 — consumed Azure AI Content Safety contract validation (US East pilot default: eastus).

check "content_safety_existing_requires_contract" {
  assert {
    condition = var.content_safety_compose_mode != "existing" || (
      length(trimspace(var.content_safety_existing_resource_id)) > 0 &&
      length(trimspace(var.content_safety_existing_endpoint)) > 0
    )
    error_message = "When content_safety_compose_mode = existing, set content_safety_existing_resource_id and content_safety_existing_endpoint."
  }
}

check "content_safety_existing_location_matches_pilot" {
  assert {
    condition = !local.content_safety_existing_mode || length(data.azurerm_cognitive_account.content_safety_existing) == 0 || (
      lower(data.azurerm_cognitive_account.content_safety_existing[0].location) == lower(trimspace(var.content_safety_expected_location))
    )
    error_message = "Consumed Azure AI Content Safety account region must match content_safety_expected_location (production-like pilot default: eastus / US East)."
  }
}

check "content_safety_create_requires_names" {
  assert {
    condition = var.content_safety_compose_mode != "create" || (
      var.content_safety_account_name != null && var.content_safety_custom_subdomain_name != null
    )
    error_message = "When content_safety_compose_mode = create, set content_safety_account_name and content_safety_custom_subdomain_name (dev/lab only — production-like stacks should use existing)."
  }
}
