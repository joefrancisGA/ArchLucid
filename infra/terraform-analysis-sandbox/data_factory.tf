resource "azurerm_data_factory" "main" {
  count = var.enable_data_factory ? 1 : 0

  name                = "adf-${var.name_prefix}-${local.suffix}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  tags                = local.merged_tags

  identity {
    type = "SystemAssigned"
  }
}

resource "azurerm_data_factory_linked_service_azure_blob_storage" "raw_landing" {
  count = var.enable_data_factory ? 1 : 0

  name            = "ls_raw_landing"
  data_factory_id = azurerm_data_factory.main[0].id
  connection_string = azurerm_storage_account.artifacts.primary_connection_string
}

resource "azurerm_data_factory_linked_service_azure_sql_database" "reporting" {
  count = var.enable_data_factory ? 1 : 0

  name              = "ls_reporting_sql"
  data_factory_id   = azurerm_data_factory.main[0].id
  connection_string = local.sql_connection_string_app
}

resource "azurerm_data_factory_dataset_azure_blob" "raw_csv" {
  count = var.enable_data_factory ? 1 : 0

  name                = "ds_raw_csv"
  data_factory_id     = azurerm_data_factory.main[0].id
  linked_service_name = azurerm_data_factory_linked_service_azure_blob_storage.raw_landing[0].name
  path                = azurerm_storage_container.golden_manifests.name
}

resource "azurerm_data_factory_dataset_azure_sql_table" "reporting_table" {
  count = var.enable_data_factory ? 1 : 0

  name              = "ds_reporting_table"
  data_factory_id   = azurerm_data_factory.main[0].id
  linked_service_id = azurerm_data_factory_linked_service_azure_sql_database.reporting[0].id
  schema            = "dbo"
  table             = "AnalysisSandboxStaging"
}

resource "azurerm_data_factory_pipeline" "landing_to_sql" {
  count = var.enable_data_factory ? 1 : 0

  name            = "pl_landing_to_sql"
  data_factory_id = azurerm_data_factory.main[0].id

  activities_json = jsonencode([
    {
      name = "CopyLandingToSql"
      type = "Copy"
      dependsOn = []
      policy = {
        timeout                = "7.00:00:00"
        retry                  = 0
        retryIntervalInSeconds = 30
        secureOutput           = false
        secureInput            = false
      }
      userProperties = []
      typeProperties = {
        source = {
          type      = "BlobSource"
          recursive = true
        }
        sink = {
          type          = "SqlSink"
          writeBehavior = "insert"
        }
        enableStaging = false
      }
      inputs = [
        {
          referenceName = azurerm_data_factory_dataset_azure_blob.raw_csv[0].name
          type          = "DatasetReference"
        },
      ]
      outputs = [
        {
          referenceName = azurerm_data_factory_dataset_azure_sql_table.reporting_table[0].name
          type          = "DatasetReference"
        },
      ]
    },
  ])
}

resource "azurerm_role_assignment" "adf_blob_contributor" {
  count = var.enable_data_factory ? 1 : 0

  scope                = azurerm_storage_account.artifacts.id
  role_definition_name = "Storage Blob Data Contributor"
  principal_id         = azurerm_data_factory.main[0].identity[0].principal_id
}

resource "azurerm_role_assignment" "adf_sql_db_contributor" {
  count = var.enable_data_factory ? 1 : 0

  scope                = azurerm_mssql_database.app.id
  role_definition_name = "SQL DB Contributor"
  principal_id         = azurerm_data_factory.main[0].identity[0].principal_id
}
