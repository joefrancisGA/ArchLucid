check "private_connectivity_inputs" {
  assert {
    condition = !var.enable_private_data_plane || (
      length(trimspace(var.resource_group_name)) > 0 &&
      (!var.create_resource_group || length(trimspace(var.location)) > 0) &&
      length(trimspace(var.sql_server_id)) > 0 &&
      length(trimspace(var.storage_account_id)) > 0
    )
    error_message = "With enable_private_data_plane = true, set resource_group_name, sql_server_id, storage_account_id, and location when create_resource_group is true."
  }
}

check "private_sql_server_id_arm_format" {
  assert {
    condition = length(trimspace(var.sql_server_id)) == 0 || can(
      regex(
        "(?i)^/subscriptions/[0-9a-f-]+/resourceGroups/[^/]+/providers/Microsoft\\.Sql/servers/[^/]+$",
        var.sql_server_id
      )
    )
    error_message = "sql_server_id must be a Microsoft.Sql/servers/* ARM resource ID when set."
  }
}

check "private_storage_account_id_arm_format" {
  assert {
    condition = length(trimspace(var.storage_account_id)) == 0 || can(
      regex(
        "(?i)^/subscriptions/[0-9a-f-]+/resourceGroups/[^/]+/providers/Microsoft\\.Storage/storageAccounts/[^/]+$",
        var.storage_account_id
      )
    )
    error_message = "storage_account_id must be a Microsoft.Storage/storageAccounts/* ARM resource ID when set."
  }
}

