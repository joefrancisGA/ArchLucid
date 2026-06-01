locals {
  enabled = var.enable_cosmos_account

  resource_group_name = local.enabled ? (
    var.create_resource_group ? azurerm_resource_group.this[0].name : data.azurerm_resource_group.target[0].name
  ) : ""

  azure_location = local.enabled ? (
    var.create_resource_group ? var.location : data.azurerm_resource_group.target[0].location
  ) : ""

  private_endpoint_enabled = local.enabled && var.enable_private_endpoint && length(trimspace(var.private_endpoint_subnet_id)) > 0

  dns_zone_resource_group_name = length(trimspace(var.private_dns_zone_resource_group_name)) > 0 ? trimspace(var.private_dns_zone_resource_group_name) : local.resource_group_name

  geo_locations = length(var.cosmos_geo_locations) > 0 ? var.cosmos_geo_locations : [
    {
      location          = local.azure_location
      failover_priority = 0
      zone_redundant    = false
    }
  ]

  sql_containers = {
    graph-snapshots = { partition_key = "/graphSnapshotId", default_ttl = -1 }
    agent-traces    = { partition_key = "/runId", default_ttl = 7776000 }
    audit-events    = { partition_key = "/tenantId", default_ttl = -1 }
    audit-events-leases = { partition_key = "/id", default_ttl = -1 }
  }
}

data "azurerm_resource_group" "target" {
  count = local.enabled && !var.create_resource_group ? 1 : 0
  name  = var.resource_group_name
}

resource "azurerm_resource_group" "this" {
  count    = local.enabled && var.create_resource_group ? 1 : 0
  name     = var.resource_group_name
  location = var.location
  tags     = var.tags
}

resource "azurerm_cosmosdb_account" "polyglot" {
  count = local.enabled ? 1 : 0

  name                = var.cosmos_account_name
  location            = local.azure_location
  resource_group_name = local.resource_group_name
  offer_type          = var.cosmos_offer_type
  kind                = "GlobalDocumentDB"

  free_tier_enabled              = var.cosmos_enable_free_tier
  automatic_failover_enabled       = var.cosmos_enable_automatic_failover
  public_network_access_enabled = local.private_endpoint_enabled ? false : var.public_network_access_enabled

  consistency_policy {
    consistency_level = var.cosmos_consistency_level
  }

  dynamic "geo_location" {
    for_each = local.geo_locations
    content {
      location          = geo_location.value.location
      failover_priority = geo_location.value.failover_priority
      zone_redundant    = try(geo_location.value.zone_redundant, false)
    }
  }

  dynamic "backup" {
    for_each = var.cosmos_enable_continuous_backup ? [1] : []
    content {
      type = "Continuous"
    }
  }

  tags = var.tags
}

resource "azurerm_cosmosdb_sql_database" "archlucid" {
  count = local.enabled ? 1 : 0

  name                = var.cosmos_database_name
  resource_group_name = local.resource_group_name
  account_name        = azurerm_cosmosdb_account.polyglot[0].name
}

resource "azurerm_cosmosdb_sql_container" "polyglot" {
  for_each = local.enabled ? local.sql_containers : {}

  name                  = each.key
  resource_group_name   = local.resource_group_name
  account_name          = azurerm_cosmosdb_account.polyglot[0].name
  database_name         = azurerm_cosmosdb_sql_database.archlucid[0].name
  partition_key_paths   = [each.value.partition_key]
  default_ttl           = each.value.default_ttl

  throughput = var.cosmos_offer_type == "Standard" ? var.cosmos_sql_container_throughput : null
}
