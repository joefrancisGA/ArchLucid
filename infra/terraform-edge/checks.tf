check "front_door_required_inputs" {
  assert {
    condition = !var.enable_front_door_waf || (
      length(trimspace(var.resource_group_name)) > 0 &&
      length(trimspace(var.front_door_profile_name)) > 0 &&
      length(trimspace(var.backend_hostname)) > 0 &&
      (!var.create_resource_group || length(trimspace(var.location)) > 0)
    )
    error_message = "With enable_front_door_waf = true, set resource_group_name, front_door_profile_name, backend_hostname. If create_resource_group = true, also set location."
  }
}
