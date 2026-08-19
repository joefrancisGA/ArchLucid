# Canonical pilot profile root: no Azure resources here - encodes opinionated defaults
# and the nested stack order for the opt-in multi-root (separate state per directory) workflow.
# Composition roots use root_path (not path) so CI path-order parsing stays leaf-only.

locals {
  # Metadata contracts for the three hosted operator waves. Never Azure-applied.
  composition_roots = [
    {
      wave        = "foundation"
      root_path   = "infra/terraform-foundation"
      azure_apply = false
    },
    {
      wave        = "platform"
      root_path   = "infra/terraform-platform"
      azure_apply = false
    },
    {
      wave        = "app"
      root_path   = "infra/terraform-app"
      azure_apply = false
    },
  ]

  # Authoritative leaf ordering for the advanced path - keep in sync with $multiRootSequence.
  nested_infrastructure_roots = [
    {
      order            = 1
      id               = "private"
      path             = "infra/terraform-private"
      composition_wave = "foundation"
      pilot_essential  = true
      notes            = "VNet, private endpoints, private DNS - foundation for data planes."
      consumes_from    = ["storage"]
    },
    {
      order            = 2
      id               = "keyvault"
      path             = "infra/terraform-keyvault"
      composition_wave = "foundation"
      pilot_essential  = true
      notes            = "Key Vault plus TB-656 user-assigned API/Worker identities."
      consumes_from    = []
    },
    {
      order            = 3
      id               = "sql_failover"
      path             = "infra/terraform-sql-failover"
      composition_wave = "platform"
      pilot_essential  = true
      notes            = "Azure SQL; use Basic/S0-class SKUs for pilots per PILOT_PROFILE.md."
      consumes_from    = []
    },
    {
      order            = 4
      id               = "storage"
      path             = "infra/terraform-storage"
      composition_wave = "platform"
      pilot_essential  = true
      notes            = "Blob/queue for artifacts and durable jobs."
      consumes_from    = []
    },
    {
      order            = 5
      id               = "redis"
      path             = "infra/terraform-redis"
      composition_wave = "platform"
      pilot_essential  = false
      notes            = "TB-094: Azure Cache for Redis for HotPathCache; optional for single-replica pilots."
      consumes_from    = ["private", "keyvault"]
    },
    {
      order            = 6
      id               = "cosmos"
      path             = "infra/terraform-cosmos"
      composition_wave = "platform"
      pilot_essential  = false
      notes            = "TB-095: Optional Cosmos DB (SQL API) for polyglot graph/traces/audit; dormant on production-like pilots."
      consumes_from    = ["private", "keyvault"]
    },
    {
      order            = 7
      id               = "servicebus"
      path             = "infra/terraform-servicebus"
      composition_wave = "platform"
      pilot_essential  = false
      notes            = "Optional messaging; enable when integration consumers are in scope."
      consumes_from    = ["private"]
    },
    {
      order            = 8
      id               = "logicapps"
      path             = "infra/terraform-logicapps"
      composition_wave = "platform"
      pilot_essential  = false
      notes            = "Optional Logic Apps Standard (ADR 0019); after messaging + DNS."
      consumes_from    = ["servicebus", "private"]
    },
    {
      order            = 9
      id               = "openai"
      path             = "infra/terraform-openai"
      composition_wave = "platform"
      pilot_essential  = true
      notes            = "TB-093: Consumed Azure OpenAI (platform-owned account in eastus); this root is budget-only - wire app settings/RBAC in terraform-container-apps or deploy/hosted-prod-terraform."
      consumes_from    = []
    },
    {
      order            = 10
      id               = "acr"
      path             = "infra/terraform-acr"
      composition_wave = "platform"
      pilot_essential  = true
      notes            = "TB-097: Azure Container Registry for API/Worker/UI images; wire acr_id into container-apps."
      consumes_from    = ["private", "keyvault"]
    },
    {
      order            = 11
      id               = "entra"
      path             = "infra/terraform-entra"
      composition_wave = "app"
      pilot_essential  = true
      notes            = "Entra app registrations / consent for API + UI. After ACR so compute can pin identities."
      consumes_from    = ["acr"]
    },
    {
      order            = 12
      id               = "container_apps"
      path             = "infra/terraform-container-apps"
      composition_wave = "app"
      pilot_essential  = true
      notes            = "API, Worker, UI - cap maxReplicas for pilots; align with pilot_monthly_budget_usd."
      consumes_from    = ["private", "storage", "keyvault", "entra", "servicebus", "openai", "redis", "acr"]
    },
    {
      order            = 13
      id               = "edge"
      path             = "infra/terraform-edge"
      composition_wave = "app"
      pilot_essential  = false
      notes            = "Front Door / WAF - usually omitted for internal pilots."
      consumes_from    = ["container_apps"]
    },
    {
      order            = 14
      id               = "apim_consumption"
      path             = "infra/terraform"
      composition_wave = "app"
      pilot_essential  = false
      notes            = "Optional Consumption APIM - not a substitute for all private topologies."
      consumes_from    = ["container_apps"]
    },
    {
      order            = 15
      id               = "monitoring"
      path             = "infra/terraform-monitoring"
      composition_wave = "app"
      pilot_essential  = false
      notes            = "Log Analytics, dashboards; keep sampling aligned to app_insights_sampling_percent."
      consumes_from    = ["container_apps"]
    },
    {
      order            = 16
      id               = "orchestrator"
      path             = "infra/terraform-orchestrator"
      composition_wave = "legacy"
      pilot_essential  = false
      notes            = "Optional automation root; hosted 3-wave path omits this. Use apply-saas.ps1 -LegacyLeafRoots."
      consumes_from    = []
    },
  ]
}
