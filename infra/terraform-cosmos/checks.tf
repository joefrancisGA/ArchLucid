check "cosmos_account_name_length" {
  assert {
    condition     = !var.enable_cosmos_account || (length(var.cosmos_account_name) >= 3 && length(var.cosmos_account_name) <= 44)
    error_message = "cosmos_account_name must be 3-44 characters when enable_cosmos_account is true."
  }
}

check "resource_group_when_enabled" {
  assert {
    condition     = !var.enable_cosmos_account || length(trimspace(var.resource_group_name)) > 0
    error_message = "resource_group_name is required when enable_cosmos_account is true."
  }
}

check "location_when_creating_rg" {
  assert {
    condition     = !var.enable_cosmos_account || !var.create_resource_group || length(trimspace(var.location)) > 0
    error_message = "location is required when create_resource_group is true."
  }
}

check "private_endpoint_subnet_when_enabled" {
  assert {
    condition     = !var.enable_private_endpoint || length(trimspace(var.private_endpoint_subnet_id)) > 0
    error_message = "private_endpoint_subnet_id is required when enable_private_endpoint is true."
  }
}

check "consistency_minimum_session" {
  assert {
    condition     = contains(["Session", "BoundedStaleness", "Strong", "ConsistentPrefix"], var.cosmos_consistency_level)
    error_message = "cosmos_consistency_level must be Session or stronger (TB-095 minimum Session)."
  }
}
