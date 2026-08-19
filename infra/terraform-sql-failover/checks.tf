check "sql_failover_required_inputs" {
  assert {
    condition = !var.enable_sql_failover_group || (
      length(trimspace(var.primary_sql_server_resource_id)) > 0 &&
      length(trimspace(var.partner_sql_server_resource_id)) > 0 &&
      length(var.database_resource_ids) > 0
    )
    error_message = "With enable_sql_failover_group = true, set primary_sql_server_resource_id, partner_sql_server_resource_id, and a non-empty database_resource_ids list (primary database resource IDs)."
  }
}

check "sql_failover_placeholder_ids" {
  assert {
    condition = !var.enable_sql_failover_group || (
      !strcontains(var.primary_sql_server_resource_id, "placeholder-primary") &&
      !strcontains(var.partner_sql_server_resource_id, "placeholder-secondary")
    )
    error_message = "With enable_sql_failover_group = true, replace default placeholder SQL server resource IDs with real Microsoft.Sql/servers IDs."
  }
}

check "sql_failover_automatic_uses_grace" {
  assert {
    condition     = !var.enable_sql_failover_group || var.read_write_failover_mode != "Automatic" || var.read_write_grace_minutes >= 60
    error_message = "Automatic read/write failover requires read_write_grace_minutes >= 60."
  }
}

check "sql_consumption_budget_requires_scope" {
  assert {
    condition = !local.sql_consumption_budget_enabled || (
      length(trimspace(var.sql_consumption_budget_resource_group_id)) > 0 ||
      !strcontains(var.primary_sql_server_resource_id, "placeholder-primary")
    )
    error_message = "SQL consumption budget is enabled but scope is still the placeholder primary_sql_server_resource_id. Set sql_consumption_budget_resource_group_id to the SQL resource group ARM id, set primary_sql_server_resource_id to a real Microsoft.Sql/servers id, or set enable_sql_consumption_budget = false."
  }
}

check "sql_consumption_budget_contact_channel" {
  assert {
    condition = !local.sql_consumption_budget_enabled || (
      length(var.sql_consumption_budget_contact_emails) > 0 ||
      length(var.sql_consumption_budget_contact_roles) > 0
    )
    error_message = "With the SQL consumption budget enabled, set sql_consumption_budget_contact_emails and/or a non-empty sql_consumption_budget_contact_roles list so Azure Cost Management can deliver notifications."
  }
}

check "sql_automatic_tuning_primary_not_placeholder" {
  assert {
    condition = !var.enable_sql_automatic_tuning || (
      !strcontains(var.primary_sql_server_resource_id, "placeholder-primary")
    )
    error_message = "With enable_sql_automatic_tuning = true, set primary_sql_server_resource_id to a real Microsoft.Sql/servers ARM id (not the default placeholder)."
  }
}

check "posture_production_requires_sql_failover_group" {
  assert {
    condition     = !local.posture_is_production || var.enable_sql_failover_group
    error_message = "posture_tier = production requires enable_sql_failover_group = true (RPO < 5 minutes)."
  }
}

check "posture_staging_sql_failover_or_waiver" {
  assert {
    condition = !local.posture_is_staging || var.enable_sql_failover_group || contains(
      local.posture_waiver_ids,
      "staging-sql-failover-drill-window"
    )
    error_message = "posture_tier = staging requires enable_sql_failover_group = true or posture_waivers entry id = staging-sql-failover-drill-window (TB-905 drill-window model)."
  }
}

check "posture_staging_or_production_requires_sql_consumption_budget" {
  assert {
    condition     = !local.posture_is_staging_or_production || var.enable_sql_consumption_budget
    error_message = "posture_tier staging/production requires enable_sql_consumption_budget = true."
  }
}
