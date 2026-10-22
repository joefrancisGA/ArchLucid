# SN-RT-03 — SQL catalog + Container App FQDN edges (Option A)

**Wave:** SecureNow runtime connections (**SN-RT**). **Option A.** **Depends on:** SN-RT-01 + SN-RT-02. **Do not** implement SN-RT-04–10.

Do not implement from the wave index. Implement only *What to build*.

## Goal

Turn parsed hosts/catalogs into graph edges:

- SQL FQDN + unique catalog → `Microsoft.Sql/servers/databases` ARM id (`hostnameInferredTarget` or a catalog-specific inference source).
- Unique SQL FQDN without catalog → **server** ARM id (existing behavior) + completeness warning `app-settings-sql-catalog-missing`.
- Container App ingress FQDN in another app’s env (`ARCHLUCID_API_BASE_URL`) → Container App ARM id.

## Why

DEV SQL databases are `archlucid`, `archlucid-dev`, `archlucidtenantedev`. Host index today maps `*.database.windows.net` to the **server**. UI→API is a hostname in env, not RBAC.

## Context

- `ArchLucid.Core/AzureExtractor/AzureInventoryAdfLinkedServiceTargetResolver.cs` (`BuildHostIndex` / `ExtractKnownHosts`)
- `ArchLucid.Application/InfraEvidence/AzureInventoryAppSettingHostEdgeMapper.cs`
- `AzureInventoryNeverShowSqlDatabaseNames` — do **not** edge to `master`
- Container App `properties.configuration.ingress.fqdn`

## What to build

1. Extend host index:
   - SQL **databases**: `{server}.database.windows.net|{catalog}` (ordinal ignore-case) → database ARM id when **exactly one** inventoried database matches name+server.
   - Container Apps: ingress FQDN (lowercase) → app ARM id when unique.
2. Mapper: if row has host+catalog, prefer database id; else server id + warning. Never target `master`.
3. Ambiguous (two databases same name on different servers, or catalog not in snapshot): warning, **no** edge (or server-only if host unique — pick one and test it; prefer **no database edge** + warning).
4. Tests:
   - Catalog `archlucid` + one server → edge to database ARM id, ProvenanceKind `DeterministicInference`.
   - `{0}` catalog null → server edge only + template warning.
   - `master` catalog → no edge.
   - UI env host equals API ingress FQDN → UI→API edge.
   - Two apps sharing FQDN (should not happen) → no edge.

## Acceptance criteria

Data Flow **can** receive hostnameInferredTarget from app-settings mapper to a **database** node. UI→API inferred when FQDNs match. `master` never linked.

## Constraints

- Working-tree check. Do **not** claim ObservedFact. Do **not** add OpenAI hosts (SN-RT-04).
- Do **not** change Network compile.
- Stage only this prompt’s paths. **No `git add -A`.**
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.

## Verification

```bash
dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj --filter 'FullyQualifiedName~AppSettingHost'
dotnet test ArchLucid.Core.Tests/ArchLucid.Core.Tests.csproj --filter 'FullyQualifiedName~AdfLinkedServiceTargetResolver'
pwsh -NoProfile -File scripts/ci/agent-compile-check.ps1 -ProjectPath 'ArchLucid.Application/ArchLucid.Application.csproj'
```

Heartbeat every 8s if >15s.

## Done when

Mapper tests prove database-grain SQL edges and UI→API FQDN edges without inventing catalogs.
