# Optional Cosmos DB account. Disabled by default per V1_DEFERRED optional services.

resource "azurerm_cosmosdb_account" "optional" {
  count = var.enable_cosmosdb ? 1 : 0

  name                = var.cosmosdb_account_name
  location            = var.location
  resource_group_name = azurerm_resource_group.prod.name
  offer_type          = "Standard"
  kind                = "GlobalDocumentDB"
  tags                = var.tags

  geo_location {
    location          = var.location
    failover_priority = 0
  }
}
