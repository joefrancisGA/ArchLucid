check "startup_config_warnings_requires_workspace_when_enabled" {
  assert {
    condition = !var.enabled || (
      length(trimspace(var.azure_monitor_workspace_id)) > 0 &&
      length(trimspace(var.resource_group_name)) > 0 &&
      length(trimspace(var.ops_action_group_id)) > 0
    )
    error_message = "startup_config_warnings module: enabled=true requires azure_monitor_workspace_id, resource_group_name, and ops_action_group_id."
  }
}
