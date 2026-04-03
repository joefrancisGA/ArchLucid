check "storage_account_name_length" {
  assert {
    condition     = !var.enable_storage_account || (length(var.storage_account_name) >= 3 && length(var.storage_account_name) <= 24)
    error_message = "storage_account_name must be 3-24 characters when enable_storage_account is true."
  }
}

check "resource_group_when_enabled" {
  assert {
    condition     = !var.enable_storage_account || length(trimspace(var.resource_group_name)) > 0
    error_message = "resource_group_name is required when enable_storage_account is true."
  }
}

check "location_when_creating_rg" {
  assert {
    condition     = !var.enable_storage_account || !var.create_resource_group || length(trimspace(var.location)) > 0
    error_message = "location is required when create_resource_group is true."
  }
}
