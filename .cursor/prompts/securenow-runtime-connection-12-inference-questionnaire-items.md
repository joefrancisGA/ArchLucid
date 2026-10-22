# SN-RT-12 — Inference questionnaire items (Option E)

**Wave:** SecureNow runtime connections (**SN-RT**). **Option E.** **Depends on:** SN-RT-03 preferred (host index + catalog warnings). Reuse SN-RT-10 proposed-edge DTO if present. **Do not** implement SN-RT-13 UI except a stable item shape the UI can consume.

Do not implement from the wave index. Implement only *What to build*.

## Goal

From an inventory snapshot (no upload, no Azure HTTP), emit **questionnaire items** for edges Option A cannot close honestly: `{0}` tenant catalogs, SQL host without catalog, unresolved hosts, and UI→API when both apps share a Container Apps Environment but env did not name the FQDN.

Items are **proposed** only. Never paint Data Flow until the operator answers in **SN-RT-13** / the SN-RT-10 confirm API.

## Why

DEV tenant topology uses `ArchLucid__SqlTopology__TenantCatalogConnectionStringTemplate` with `{0}`. A can only edge to the **server**. Isolated nodes that “look related” (same CAE, same RG) must not become silent **May access**. The operator already accepted a confirm/deny questionnaire as the cheapest close for those gaps.

## Context

- `docs/securenow/RUNTIME_DECLARED_AND_OBSERVED_DATA_FLOWS.md` §E
- `AzureInventoryNeverShowSqlDatabaseNames` — skip `master` / `msdb` / `tempdb`
- SN-RT-10 proposed-edge DTO (`source` must include `questionnaire`)
- Completeness warning codes from SN-RT-02/03 (`app-settings-catalog-template`, `app-settings-sql-catalog-missing`)

## What to build

1. Deterministic generator over one snapshot. `source = questionnaire`. Cap items (document the cap in tests; suggested 50). Never cartesian-product every compute × every SQL in the subscription.
2. Emit items **only** when a named rule fires:

   | Rule | Question shape (sentence case) |
   |------|--------------------------------|
   | Catalog template `{0}` / `{tenant}` on a unique SQL server | Does {app} connect to database {name} on {server}? One item per inventoried **user** database on that server |
   | SQL host unique, catalog null | Which database does {app} use on {server}? (choices = user databases + “server only” + skip) |
   | Unresolved host in env/upload row | Which inventoried resource is {host}? (dropdown; optional external node) |
   | Two Container Apps in the same CAE; one has ingress FQDN; the other has no matching env host | Does {ui} call {api} at {fqdn}? |

3. Do **not** emit “same resource group so they must talk.” Do **not** emit ACR / CAE / `master` / UAMI items.
4. Deduplicate against edges already painted as hostname inference or RBAC **May access** (same from→to ARM ids).
5. Tests: `{0}` + databases `archlucid`, `archlucidtenantedev`, `master` → two items, no `master`; two apps in different CAEs → no UI→API item; 200 databases → cap + warning, not 200 auto-edges.

## Acceptance criteria

Generator produces proposed items only. Snapshot with no template/unresolved host → empty questionnaire. No Azure calls. No secret values.

## Constraints

- Working-tree check. Do **not** auto-confirm. Do **not** implement the ask UI (SN-RT-13).
- Do **not** merge items into ObservedRuntime or **May access**.
- Stage only this prompt’s paths. **No `git add -A`.**
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.

## Verification

```bash
dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj --filter 'FullyQualifiedName~QuestionnaireItem|FullyQualifiedName~InferenceQuestionnaire'
pwsh -NoProfile -File scripts/ci/agent-compile-check.ps1 -ProjectPath 'ArchLucid.Application/ArchLucid.Application.csproj'
```

Heartbeat every 8s if >15s. No full-solution build, no `npm ci`.

## Done when

Tests prove template → per-database items, `master` skipped, CAE mismatch skipped, cap honored, zero canvas edges from this prompt alone.
