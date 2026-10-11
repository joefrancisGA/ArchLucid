locals {
  role_scopes = [
    local.storage_container_scope,
    var.collection_read_scope,
    local.enabled ? try(azurerm_key_vault.this[0].id, "") : "",
    local.enabled ? try(azurerm_automation_account.collection[0].id, "") : "",
    local.enabled ? trimspace(var.azure_openai_account_id) : "",
  ]

  declared_role_names = [
    "Storage Blob Data Contributor",
    "Reader",
    "Key Vault Secrets Officer",
    "Key Vault Secrets User",
    "Automation Job Operator",
    "Cognitive Services OpenAI User",
  ]

  prohibited_role_names = [
    "Owner",
    "Contributor",
    "User Access Administrator",
  ]
}

check "uhg_names_are_product_owned" {
  assert {
    condition     = lower(trimspace(var.edition)) != "uhg" || !strcontains(lower(trimspace(var.name_prefix)), "archlucid")
    error_message = "UHG SecureNow resource names must not contain archlucid."
  }
}

check "deployment_has_required_names" {
  assert {
    condition = !local.enabled || (
      length(trimspace(var.resource_group_name)) > 0 &&
      length(trimspace(var.storage_account_name)) > 0 &&
      length(trimspace(var.key_vault_name)) > 0
    )
    error_message = "resource_group_name, storage_account_name, and key_vault_name are required when enable_deployment is true."
  }
}

check "deployment_has_required_images" {
  assert {
    condition = !local.enabled || (
      length(trimspace(var.api_container_image)) > 0 &&
      length(trimspace(var.ui_container_image)) > 0
    )
    error_message = "api_container_image and ui_container_image are required when enable_deployment is true."
  }
}

check "deployment_has_sql_identity_inputs" {
  assert {
    condition = !local.enabled || (
      length(trimspace(var.sql_admin_login)) > 0 &&
      length(trimspace(var.sql_admin_password)) > 0 &&
      length(trimspace(var.entra_admin_login)) > 0 &&
      length(trimspace(var.entra_admin_object_id)) > 0
    )
    error_message = "SQL break-glass and Entra administrator inputs are required when enable_deployment is true."
  }
}

check "collection_scope_is_explicit" {
  assert {
    condition = !local.enabled || (
      length(trimspace(var.collection_read_scope)) > 0 &&
      !endswith(trimspace(var.collection_read_scope), "/")
    )
    error_message = "collection_read_scope must be an explicit non-root ARM scope when deployment is enabled."
  }
}

check "collection_scope_is_not_subscription_root" {
  assert {
    condition     = !local.enabled || !can(regex("^/subscriptions/[^/]+$", trimspace(var.collection_read_scope)))
    error_message = "The collection agent must not receive Reader at subscription-root scope."
  }
}

check "public_network_access_is_disabled" {
  assert {
    condition = !local.enabled || (
      module.storage.storage_account_id != null &&
      azurerm_key_vault.this[0].public_network_access_enabled == false &&
      module.sql[0].private_endpoint_id != null
    )
    error_message = "SecureNow data services must use private access paths."
  }
}

check "container_apps_are_private" {
  assert {
    condition = !local.enabled || (
      module.container_apps.api_container_app_fqdn != null &&
      module.container_apps.ui_container_app_fqdn != null
    )
    error_message = "SecureNow API and UI must be provisioned inside the private Container Apps environment."
  }
}

check "role_scopes_are_resource_scoped" {
  assert {
    condition = !local.enabled || alltrue([
      for scope in local.role_scopes : (
        length(trimspace(scope)) == 0 ||
        strcontains(scope, "/resourceGroups/${local.resource_group_name}/")
      )
    ])
    error_message = "SecureNow role assignments must be scoped to a resource or this deployment resource group; subscription-root scopes are prohibited."
  }
}

check "no_broad_role_names" {
  assert {
    condition     = alltrue([for role_name in local.declared_role_names : !contains(local.prohibited_role_names, role_name)])
    error_message = "This root intentionally uses data-plane roles and Reader/Automation Job Operator only; do not add Owner, Contributor, or User Access Administrator."
  }
}

