# Canonical pilot profile root: no Azure resources here — encodes opinionated defaults and the nested
# stack order for the opt-in multi-root (separate state per directory) workflow.

locals {
  # Authoritative ordering for the advanced path — keep in sync with docs when changing roots.
  nested_infrastructure_roots = [
    {
      order           = 1
      id              = "private"
      path            = "infra/terraform-private"
      pilot_essential = true
      notes           = "VNet, private endpoints, private DNS — foundation for data planes."
      consumes_from   = ["storage"]
    },
    {
      order           = 2
      id              = "keyvault"
      path            = "infra/terraform-keyvault"
      pilot_essential = true
      notes           = "Key Vault for secrets references from later stacks."
      consumes_from   = []
    },
    {
      order           = 3
      id              = "sql_failover"
      path            = "infra/terraform-sql-failover"
      pilot_essential = true
      notes           = "Azure SQL; use Basic/S0-class SKUs for pilots per PILOT_PROFILE.md."
      consumes_from   = []
    },
    {
      order           = 4
      id              = "storage"
      path            = "infra/terraform-storage"
      pilot_essential = true
      notes           = "Blob/queue for artifacts and durable jobs."
      consumes_from   = []
    },
    {
      order           = 5
      id              = "servicebus"
      path            = "infra/terraform-servicebus"
      pilot_essential = false
      notes           = "Optional messaging; enable when integration consumers are in scope."
      consumes_from   = ["private"]
    },
    {
      order           = 6
      id              = "logicapps"
      path            = "infra/terraform-logicapps"
      pilot_essential = false
      notes           = "Optional Logic Apps Standard (ADR 0019); after messaging + DNS."
      consumes_from   = ["servicebus", "private"]
    },
    {
      order           = 7
      id              = "openai"
      path            = "infra/terraform-openai"
      pilot_essential = false
      notes           = "Optional OpenAI budget hooks; resource creation may be out-of-band."
      consumes_from   = []
    },
    {
      order           = 8
      id              = "entra"
      path            = "infra/terraform-entra"
      pilot_essential = true
      notes           = "Entra app registrations / consent for API + UI."
      consumes_from   = []
    },
    {
      order           = 9
      id              = "container_apps"
      path            = "infra/terraform-container-apps"
      pilot_essential = true
      notes           = "API, Worker, UI — cap maxReplicas for pilots; align with pilot_monthly_budget_usd."
      consumes_from   = ["private", "storage", "keyvault", "entra", "servicebus"]
    },
    {
      order           = 10
      id              = "edge"
      path            = "infra/terraform-edge"
      pilot_essential = false
      notes           = "Front Door / WAF — usually omitted for internal pilots."
      consumes_from   = ["container_apps"]
    },
    {
      order           = 11
      id              = "apim_consumption"
      path            = "infra/terraform"
      pilot_essential = false
      notes           = "Optional Consumption APIM — not a substitute for all private topologies."
      consumes_from   = ["container_apps"]
    },
    {
      order           = 12
      id              = "monitoring"
      path            = "infra/terraform-monitoring"
      pilot_essential = false
      notes           = "Log Analytics, dashboards; keep sampling aligned to app_insights_sampling_percent."
      consumes_from   = ["container_apps"]
    },
    {
      order           = 13
      id              = "orchestrator"
      path            = "infra/terraform-orchestrator"
      pilot_essential = false
      notes           = "Optional automation root when used in your fork."
      consumes_from   = []
    },
  ]
}
