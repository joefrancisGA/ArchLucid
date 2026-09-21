# AX-DE-04 — Widen ADF hostname index

**Wave:** AX-DE. **Depends on:** AX-DE-01. **Do not** add connectors (that is **AX-DE-05**).

Follow [`.cursor/prompts/azure-extractor-diagram-enrichment-00-index.md`](azure-extractor-diagram-enrichment-00-index.md) global constraints.

## Goal

`AzureInventoryAdfLinkedServiceTargetResolver.ExtractKnownHosts` must map unique FQDNs for Cosmos, PostgreSQL, MySQL, Redis, Event Hub, Service Bus, Databricks, and App Service — not only storage / SQL / Key Vault / Synapse.

## Why

Many linked services store a host, not an ARM id. Unique hostname match is `adfLinkedServiceInferred` (DeterministicInference / **Likely connected to**). Ambiguous hosts (two SQL servers, same name across subs) stay unmatched.

## Context

- `ArchLucid.Core/AzureExtractor/AzureInventoryAdfLinkedServiceTargetResolver.cs`
- `ArchLucid.Core.Tests/AzureExtractor` hostname tests (add if missing)
- Public Azure suffixes (document in comments): `documents.azure.com`, `mongo.cosmos.azure.com`, `postgres.database.azure.com`, `mysql.database.azure.com`, `redis.cache.windows.net`, `servicebus.windows.net`, `azuredatabricks.net`, `azurewebsites.net`

## What to build

1. Extend `ExtractKnownHosts` with the ARM types above. Use resource **name** to build the well-known FQDN. Also emit `*.privatelink.*` variants only if you can do so without false positives — if unsure, skip privatelink aliases (PE association is a different edge).
2. Keep unique-host rule: two candidates → no index entry.
3. Tests: Cosmos account `acct` matches `acct.documents.azure.com`; two storage accounts do not match a shared host; existing blob/sql/kv/synapse tests still pass.
4. No new collection. No sanitizer type expansion.

## Acceptance criteria

- Inferred edges still DeterministicInference.
- No secrets.

## Constraints

- Compile: Core.Tests filter `FullyQualifiedName~AdfLinkedServiceTargetResolver`.
- Do not implement SN-DF-01 external nodes here (already a separate set).

## Done when

A Cosmos linked-service host uniquely matching an inventoried account resolves `adfLinkedServiceInferred`.
