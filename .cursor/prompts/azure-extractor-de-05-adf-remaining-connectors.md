# AX-DE-05 — Remaining ADF linked-service connectors

**Wave:** AX-DE. **Depends on:** AX-DE-01. Prefer after AX-DE-04 for host matching. **Do not** collect triggers/IRs/data flows.

Follow [`.cursor/prompts/azure-extractor-diagram-enrichment-00-index.md`](azure-extractor-diagram-enrichment-00-index.md) global constraints.

## Goal

Sanitize additional ADF connector types into `adf-linked-services.json` instead of `UnsupportedConnector`, still blocking secret-bearing `typeProperties`.

## Why

PowerShell and hosted sanitizers allow only Blob, ADLS, SQL DB/MI, Synapse, Key Vault. SAP/Oracle/files/REST/Cosmos/Event Hub/Service Bus/Snowflake never get a host or ARM id, so SN-DF-01 external nodes and inferred ARM matches never fire.

## Context

- `AzureInventoryAdfLinkedServiceSanitizer`
- `scripts/azure/ArchLucid.SecurityInventory.helpers.ps1` (`Get-ArchLucidAzureAdfLinkedServiceCompanionRows`, `New-ArchLucidAzureAdfLinkedServiceNormalizedRow`)
- `HostedAzureInventoryAdfLinkedServiceCollector`
- Blocked property name list must stay shared (do not copy-paste a second deny list without a single helper).

## What to build

1. Support (Reader GET `…/linkedservices`) at least:

   | type | Collect (no secrets) |
   |---|---|
   | `AzureCosmosDb` / `CosmosDb` | accountEndpoint host or ARM id |
   | `AzurePostgreSql` / `AzureMySql` | server host |
   | `AzureTableStorage` | already blob-adjacent; table endpoint host |
   | `AzureEventHub` / `EventHub` | namespace host |
   | `AzureServiceBus` / `ServiceBus` | namespace host |
   | `AzureDatabricks` | workspace URL host |
   | `Snowflake` | account host only |
   | `SapTable` / `SapOpenHub` / `SapEcc` / `SapHana` | type + sanitized host if present |
   | `Oracle` / `OracleServiceCloud` | type + host |
   | `FtpServer` / `Sftp` / `FileServer` / `Hdfs` | host |
   | `RestService` / `HttpServer` / `Web` | HTTPS host |
   | `AmazonS3` / `GoogleCloudStorage` | type + bucket/host if non-secret |

   If a type has only encrypted credentials, emit `TargetUnresolved` + type (for SN-DF-01), not `UnsupportedConnector`.
2. Keep `UnsupportedConnector` for truly unknown types (still a row, not dropped).
3. Parity: PowerShell allow-list and C# sanitizer **must match** (table-driven test or shared JSON fixture).
4. Tests: Cosmos endpoint `https://acct.documents.azure.com:443/` → host `acct.documents.azure.com`; `connectionString` ignored; `SecureString` skipped; SAP with no host still Succeeded/TargetUnresolved with type `SapTable`.

## Acceptance criteria

- Hosted + Tier 1 both emit the new types.
- No schema bump. Same `adf-linked-services.json` shape (`targetResourceId`, `targetHost`, `linkedServiceType`, …).

## Constraints

- Compile: Core.Tests + Integrations.AzureExtractor.Tests + Pester `scripts/azure/tests/ArchLucid.SecurityInventory.helpers.Tests.ps1` (ADF describes).
- Heartbeat on Pester if >15s.

## Done when

A `SapTable` row is no longer `UnsupportedConnector`, and a Cosmos host can resolve via AX-DE-04 if that prompt has landed (otherwise host is stored for later).
