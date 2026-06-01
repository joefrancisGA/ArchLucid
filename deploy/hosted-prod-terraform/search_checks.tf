# TB-096 — consumed Azure AI Search contract validation (US East pilot default: eastus).

check "search_existing_requires_contract" {
  assert {
    condition = var.search_compose_mode != "existing" || (
      length(trimspace(coalesce(var.search_existing_resource_id, ""))) > 0 &&
      length(trimspace(coalesce(var.search_existing_endpoint, ""))) > 0 &&
      length(trimspace(coalesce(var.search_index_name, ""))) > 0
    )
    error_message = "When search_compose_mode = existing, set search_existing_resource_id, search_existing_endpoint, and search_index_name."
  }
}

check "search_create_requires_name" {
  assert {
    condition = var.search_compose_mode != "create" || var.search_service_name != null
    error_message = "When search_compose_mode = create, set search_service_name (dev/lab only — production-like stacks should use existing)."
  }
}
