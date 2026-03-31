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
