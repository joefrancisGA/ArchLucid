resource "azurerm_mssql_database_long_term_retention_policy" "app" {
  database_id = azurerm_mssql_database.app.id

  weekly_retention  = var.sql_ltr_weekly_retention
  monthly_retention = var.sql_ltr_monthly_retention
  yearly_retention  = var.sql_ltr_yearly_retention
  week_of_year      = var.sql_ltr_week_of_year
}
