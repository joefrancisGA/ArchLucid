check "logic_apps_inputs" {
  assert {
    condition = !var.enable_logic_apps || (
      trimspace(var.resource_group_name) != "" &&
      trimspace(var.location) != "" &&
      trimspace(var.storage_account_name) != ""
    )

    error_message = "When enable_logic_apps is true, resource_group_name, location, and storage_account_name must be non-empty."
  }
}

check "governance_logic_apps_inputs" {
  assert {
    condition = !var.enable_governance_approval_logic_app || (
      trimspace(var.resource_group_name) != "" &&
      trimspace(var.location) != "" &&
      trimspace(var.governance_storage_account_name) != ""
    )

    error_message = "When enable_governance_approval_logic_app is true, resource_group_name, location, and governance_storage_account_name must be non-empty."
  }
}

check "marketplace_fulfillment_logic_apps_inputs" {
  assert {
    condition = !var.enable_marketplace_fulfillment_logic_app || (
      trimspace(var.resource_group_name) != "" &&
      trimspace(var.location) != "" &&
      trimspace(var.marketplace_fulfillment_storage_account_name) != ""
    )

    error_message = "When enable_marketplace_fulfillment_logic_app is true, resource_group_name, location, and marketplace_fulfillment_storage_account_name must be non-empty."
  }
}

check "trial_lifecycle_logic_apps_inputs" {
  assert {
    condition = !var.enable_trial_lifecycle_logic_app || (
      trimspace(var.resource_group_name) != "" &&
      trimspace(var.location) != "" &&
      trimspace(var.trial_lifecycle_storage_account_name) != ""
    )

    error_message = "When enable_trial_lifecycle_logic_app is true, resource_group_name, location, and trial_lifecycle_storage_account_name must be non-empty."
  }
}

check "incident_chatops_logic_apps_inputs" {
  assert {
    condition = !var.enable_incident_chatops_logic_app || (
      trimspace(var.resource_group_name) != "" &&
      trimspace(var.location) != "" &&
      trimspace(var.incident_chatops_storage_account_name) != ""
    )

    error_message = "When enable_incident_chatops_logic_app is true, resource_group_name, location, and incident_chatops_storage_account_name must be non-empty."
  }
}

check "promotion_customer_notify_logic_apps_inputs" {
  assert {
    condition = !var.enable_promotion_customer_notify_logic_app || (
      trimspace(var.resource_group_name) != "" &&
      trimspace(var.location) != "" &&
      trimspace(var.promotion_customer_notify_storage_account_name) != ""
    )

    error_message = "When enable_promotion_customer_notify_logic_app is true, resource_group_name, location, and promotion_customer_notify_storage_account_name must be non-empty."
  }
}
