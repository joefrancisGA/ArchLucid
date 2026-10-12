# Evidence store: Entra ID only, no public endpoint, append-only snapshots.
resource "azurerm_storage_account" "evidence" {
  name                            = var.evidence_account_name
  resource_group_name             = azurerm_resource_group.tooling.name
  location                        = var.location
  account_tier                    = "Standard"
  account_replication_type        = "ZRS" # zone-redundant; stays in the chosen region
  shared_access_key_enabled       = false
  public_network_access           = "Disabled"
  allow_nested_items_to_be_public = false
  min_tls_version                 = "TLS1_2"

  blob_properties {
    versioning_enabled = true
  }
}

resource "azurerm_storage_container" "snapshots" {
  name                  = "snapshots"
  storage_account_id    = azurerm_storage_account.evidence.id
  container_access_type = "private"
}

resource "azurerm_storage_container_immutability_policy" "snapshots" {
  storage_container_resource_manager_id = azurerm_storage_container.snapshots.id
  immutability_period_in_days           = var.snapshot_retention_days
  protected_append_writes_enabled       = true
  # Irreversible: once locked, the period can be extended but never shortened or removed.
  # Apply with false first, check the retention period, then set true.
  locked = true
}

# Model service: no API keys, no public endpoint, pinned model version.
resource "azurerm_cognitive_account" "openai" {
  name                = var.openai_account_name
  resource_group_name = azurerm_resource_group.tooling.name
  location            = var.location
  kind                = "OpenAI"
  sku_name            = "S0"
  # A custom subdomain is required for Entra ID auth and private endpoints.
  custom_subdomain_name         = var.openai_account_name
  local_auth_enabled            = false
  public_network_access_enabled = false
}

resource "azurerm_cognitive_deployment" "explain" {
  name                 = "explain-prod"
  cognitive_account_id = azurerm_cognitive_account.openai.id

  model {
    format  = "OpenAI"
    name    = var.model_name
    version = var.model_version # pinned; upgrades go through the test set (Chapter 10)
  }

  sku {
    name = var.deployment_type # recorded residency decision (section 13.5)
  }
}

resource "azurerm_private_endpoint" "openai" {
  name                = "pe-${var.openai_account_name}"
  resource_group_name = azurerm_resource_group.tooling.name
  location            = var.location
  subnet_id           = var.private_endpoint_subnet_id

  private_service_connection {
    name                           = "openai"
    private_connection_resource_id = azurerm_cognitive_account.openai.id
    subresource_names              = ["account"]
    is_manual_connection           = false
  }

  private_dns_zone_group {
    name                 = "openai"
    private_dns_zone_ids = [azurerm_private_dns_zone.openai.id]
  }
}

resource "azurerm_role_assignment" "explainer_calls_model" {
  scope                = azurerm_cognitive_account.openai.id
  role_definition_name = "Cognitive Services OpenAI User"
  principal_id         = azurerm_user_assigned_identity.explainer.principal_id
}
