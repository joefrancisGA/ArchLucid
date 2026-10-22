check "uhg_name_prefix_has_no_hosted_product_token" {
  assert {
    condition     = lower(var.edition) != "uhg" || !strcontains(lower(var.name_prefix), "archlucid")
    error_message = "A UHG name_prefix cannot include the hosted product token."
  }
}

check "uhg_support_telemetry_stays_off" {
  assert {
    condition     = lower(var.edition) != "uhg" || var.enable_support_telemetry == false
    error_message = "UHG in-tenant installs cannot enable support telemetry."
  }
}

check "private_ingress_pins_image_digests" {
  assert {
    condition = var.enable_private_ingress == false || (
      strcontains(var.api_container_image, "@sha256:") &&
      strcontains(var.worker_container_image, "@sha256:") &&
      strcontains(var.ui_container_image, "@sha256:")
    )
    error_message = "Private ingress requires API, worker, and UI images pinned with @sha256:."
  }
}

check "collection_reader_scopes_are_resource_groups" {
  assert {
    condition = alltrue([
      for id in var.collection_reader_resource_group_ids :
      can(regex("(?i)^/subscriptions/[^/]+/resourceGroups/[^/]+$", trimspace(id)))
    ])
    error_message = "collection_reader_resource_group_ids must be resource group ARM ids. Subscription and management-group scopes are broader than this root allows."
  }
}

check "storage_public_network_disabled" {
  assert {
    condition     = azurerm_storage_account.app.public_network_access_enabled == false
    error_message = "Storage public network access must stay disabled."
  }
}

check "storage_shared_keys_disabled" {
  assert {
    condition     = azurerm_storage_account.app.shared_access_key_enabled == false
    error_message = "Storage shared keys must stay disabled. Use managed identities."
  }
}

check "key_vault_public_network_disabled" {
  assert {
    condition     = azurerm_key_vault.app.public_network_access_enabled == false
    error_message = "Key Vault public network access must stay disabled."
  }
}

check "sql_public_network_disabled" {
  assert {
    condition     = module.sql.public_network_access_enabled == false
    error_message = "SQL public network access must stay disabled."
  }
}

check "openai_public_network_disabled" {
  assert {
    condition     = module.openai.public_network_access_enabled == false
    error_message = "Azure OpenAI public network access must stay disabled."
  }
}

check "private_data_plane_enabled" {
  assert {
    condition     = module.private.private_data_plane_enabled == true
    error_message = "The in-tenant root must enable the private data plane."
  }
}

check "container_apps_use_internal_load_balancer" {
  assert {
    condition     = var.enable_private_ingress == false || azurerm_container_app_environment.this[0].internal_load_balancer_enabled == true
    error_message = "Private ingress must use an internal load balancer."
  }
}

check "container_apps_ingress_is_not_public" {
  assert {
    condition = var.enable_private_ingress == false || (
      azurerm_container_app.api[0].ingress[0].external_enabled == false &&
      azurerm_container_app.ui[0].ingress[0].external_enabled == false
    )
    error_message = "API and UI ingress must not be reachable from the public internet."
  }
}
