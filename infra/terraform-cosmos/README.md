# terraform-cosmos (TB-095)

Optional Azure Cosmos DB (SQL API) for polyglot persistence (`CosmosDb:*` in `ArchLucid.Persistence`).

**Assessment (2026-06-01):** Hosted production-like pilots keep all `CosmosDb` feature flags **off** and an empty `ConnectionString` in `appsettings.json`. SQL/InMemory paths remain authoritative. This root is for teams that explicitly enable polyglot flags.

See `docs/library/COSMOS_DB_IAC_ASSESSMENT.md`.
