# SN-COL-02 — Collection run records and blob ingest

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-* prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_MENU_AND_EDITIONS_LUNA_PROMPTS.md`

**Depends on:** SN-COL-01, with status **Accepted**. If the ADR is still Proposed, stop and say so.

## Goal

SecureNow records every collection run the agent reports, reads new run manifests from the customer's collection storage as the accepted ADR decided, and imports a ZIP through the same pipeline manual upload uses.

## Read first

- The accepted SN-COL-01 ADR. It overrides this prompt wherever they differ.
- `ArchLucid.Api/Controllers/Authority/CloudInventoryExtractorUploadController.cs` (the import path manual upload uses)
- `ArchLucid.Persistence/AzureExtractor/SqlTenantHostedExtractorConfigurationRepository.cs` and its in-memory twin
- `ArchLucid.Host.Composition/Configuration/SqlStorageProviderRegistrar.TenantRepositories.ExtractorsProvenance.cs` and `InMemoryStorageProviderRegistrar.*`
- `ArchLucid.Persistence/Migrations/README.md`, `ArchLucid.Persistence/Scripts/README.md` (which schema file is the single DDL file for this database)
- `docs/architecture/adrs/0037-tenant-isolation-without-rls-defense-in-depth.md`
- `.cursor/rules/Tenant-Isolation-Defense-In-Depth.mdc`

## What to build

Split by layer, one class per file:

- **Data model:** a `CollectionRun` record (tenant, workspace, project scope, run id, agent version, started, finished, status, subscriptions covered, error summary, ZIP path, ZIP SHA-256, imported snapshot id). Status is an enum: `Running`, `Succeeded`, `PartiallySucceeded`, `Failed`, `Imported`, `Rejected`.
- **Interface:** `ICollectionRunRepository` with SQL (Dapper) and in-memory implementations, registered for both storage providers. Every query is scoped by tenant, workspace, and project.
- **Service:** `CollectionRunIngestService` reads a manifest, upserts the run, and imports the ZIP through the existing import path only when the hash is new. An unsupported schema version marks the run `Rejected` with a reason and does not import.
- **Orchestration:** the discovery mechanism the ADR chose (event handler or polling hosted service), behind its own interface so it can be swapped.
- **API:** `GET /v1/collection-runs` (paged, newest first) and `GET /v1/collection-runs/{runId}`, read authority, scoped. Update OpenAPI snapshots and generated UI types through the repo scripts.

Add the SQL migration in the next migration number, add its rollback, and add the same DDL to the single master schema file for this database, following `ArchLucid.Persistence/Migrations/README.md`.

## Tests

1. A new manifest with a new hash creates a run and imports one snapshot.
2. The same manifest again does not import twice.
3. An unsupported schema version marks the run `Rejected` and imports nothing.
4. A run in another tenant is never returned.
5. Both storage providers pass the same repository contract tests.
6. The API returns runs newest first and 404s for another tenant's run id.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- One class per file. Dapper, not an ORM. Explicit types over `var`. Null-check inputs. No `ConfigureAwait(false)` in tests.
- Compile once: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Api/ArchLucid.Api.csproj'`, then run the new tests.
- Regenerate contracts with `ARCHLUCID_REGENERATE_UI_API_TYPES=1 bash scripts/ci/update_openapi_contract_snapshot.sh`. Do not hand-edit the JSON.
- No write to customer Azure resources. Read only from the collection container the ADR names.
- No SQL row-level security.
- Do not commit.

## Done when

A collection run that the agent reports appears in `GET /v1/collection-runs`, a new ZIP becomes one imported snapshot, and a repeat or unsupported ZIP does not.
