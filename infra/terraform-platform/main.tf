# Wave 2 metadata contract. Azure apply stays on the leaf roots listed below.
# Azure AI Search and Content Safety stay inside terraform-container-apps (no new leaves).

locals {
  child_roots = [
    {
      order         = 1
      id            = "sql_failover"
      path          = "infra/terraform-sql-failover"
      notes         = "Azure SQL failover group / consumption budget."
      consumes_from = []
    },
    {
      order         = 2
      id            = "storage"
      path          = "infra/terraform-storage"
      notes         = "Blob/queue for artifacts and durable jobs."
      consumes_from = []
    },
    {
      order         = 3
      id            = "redis"
      path          = "infra/terraform-redis"
      notes         = "TB-094: Azure Cache for Redis for HotPathCache."
      consumes_from = ["private", "keyvault"]
    },
    {
      order         = 4
      id            = "cosmos"
      path          = "infra/terraform-cosmos"
      notes         = "TB-095: Optional Cosmos DB (SQL API); dormant unless enabled."
      consumes_from = ["private", "keyvault"]
    },
    {
      order         = 5
      id            = "servicebus"
      path          = "infra/terraform-servicebus"
      notes         = "Optional messaging for integration consumers."
      consumes_from = ["private"]
    },
    {
      order         = 6
      id            = "logicapps"
      path          = "infra/terraform-logicapps"
      notes         = "Optional Logic Apps Standard (ADR 0019); after messaging + DNS."
      consumes_from = ["servicebus", "private"]
    },
    {
      order         = 7
      id            = "openai"
      path          = "infra/terraform-openai"
      notes         = "TB-093: Consumed Azure OpenAI budget/hooks (platform-owned account)."
      consumes_from = []
    },
    {
      order         = 8
      id            = "acr"
      path          = "infra/terraform-acr"
      notes         = "TB-097: Azure Container Registry; wire acr_id into container-apps."
      consumes_from = ["private", "keyvault"]
    },
  ]
}
