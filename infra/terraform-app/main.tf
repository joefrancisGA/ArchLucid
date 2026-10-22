# Wave 3 metadata contract. Azure apply stays on the leaf roots listed below.
# terraform-orchestrator is not in this wave; use apply-saas.ps1 -LegacyLeafRoots.

locals {
  child_roots = [
    {
      order         = 1
      id            = "entra"
      path          = "infra/terraform-entra"
      notes         = "Entra app registrations after ACR exists so compute can pin identities."
      consumes_from = ["acr"]
    },
    {
      order         = 2
      id            = "container_apps"
      path          = "infra/terraform-container-apps"
      notes         = "API/Worker plus Search and Content Safety. After Entra, Redis, and ACR."
      consumes_from = ["entra", "keyvault", "sql_failover", "storage", "openai", "redis", "acr"]
    },
    {
      order         = 3
      id            = "edge"
      path          = "infra/terraform-edge"
      notes         = "Front Door / WAF in front of Container Apps."
      consumes_from = ["container_apps"]
    },
    {
      order         = 4
      id            = "apim_consumption"
      path          = "infra/terraform"
      notes         = "APIM consumption SKU; OpenAPI import after the API hostname exists."
      consumes_from = ["container_apps"]
    },
    {
      order         = 5
      id            = "monitoring"
      path          = "infra/terraform-monitoring"
      notes         = "Log Analytics / App Insights after compute exists."
      consumes_from = ["container_apps"]
    },
  ]
}
