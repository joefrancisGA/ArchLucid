# SN-RT-01 — Container Apps env companion (Option A)

**Wave:** SecureNow runtime connections (**SN-RT**). **Option A.** **Depends on:** AX-DE-18 row shape on trunk. **Do not** implement SN-RT-02–10.

Do not implement from the wave index. Implement only *What to build*.

## Goal

Collect Container App environment variable **names**, parsed **hosts**, Key Vault URI **hosts**, and `secretRef` **names** from the ARM GET into the existing `app-settings-hosts.json` companion — without `config/list` and without persisting values.

## Why

ArchLucid DEV (and the analysis sandbox) put SQL/KV/blob/API URLs on Container Apps env. `Get-ArchLucidAzureAppSettingHostCompanionRows` only walks `Microsoft.Web/sites` and POSTs `config/appsettings/list`. Container Apps env is already on `GET {containerAppId}?api-version=2024-03-01` → `properties.template.containers[].env[]` (`name` + `value` **or** `secretRef`). Subscription **Reader** is enough. Hosted must stay GET-only.

## Context

- `docs/securenow/RUNTIME_DECLARED_AND_OBSERVED_DATA_FLOWS.md`
- `.cursor/prompts/securenow-runtime-connection-00-index.md`
- `scripts/azure/ArchLucid.SecurityInventory.helpers.ps1` (`Get-ArchLucidAzureAppSettingHostCompanionRows`)
- `ArchLucid.Core/AzureExtractor/AzureInventoryAppSettingHostRow.cs`
- Hosted extractor GET path (mirror collection; no POST)

## What to build

1. Extend the companion collector to include `Microsoft.App/containerApps`. Prefer ARM GET of the Container App (already in inventory flatten when properties exist). If nested `env` is empty on the list row, type-scoped GET that one Container App (not GET-every-id in the subscription).
2. For each env entry: persist `siteResourceId` (the Container App ARM id), `settingName`, `host` (when SN-RT-02 parser exists, call a stub that today reuses `Server=tcp:` / KV SecretUri extractors), `keyVaultHost`, `secretName`, `secretRef` (name only), `collectionStatus`. Never persist `value`.
3. Redact with the existing `AzureInventoryAppSettingHostRedactor` — reject secret-like payloads.
4. Hosted path: GET-only. If env is not on the GET payload, emit a completeness warning (`app-settings-hosts-container-apps-env-missing`) and skip — do **not** POST.
5. Tests (must fail on current master, pass after):
   - Fixture Container App with `ConnectionStrings__ArchLucid=Server=tcp:sql1.database.windows.net,1433;...` emits one host row, **no** full connection string in JSON.
   - `secretRef: al-cs-key` emits secret **name** only.
   - `Microsoft.Web/sites` path unchanged (existing tests still pass).
   - Hosted client never calls POST for Container Apps.

## Acceptance criteria

- A fresh extractor ZIP against Container Apps includes `app-settings-hosts.json` rows keyed by Container App ARM id.
- No passwords, keys, or full connection strings in companions or logs.
- Hosted stays GET-only.

## Constraints

- Working-tree safety: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- Do **not** implement catalog/HTTPS parse (SN-RT-02) beyond reusing today’s extractors.
- Do **not** open `DiagramDataFlowEdgeFilter`. Do **not** add hosted POST.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
- Stage only this prompt’s paths. **No `git add -A`.**

## Verification

```bash
pwsh -NoProfile -Command "Invoke-Pester -Strict -EnableExit -Path 'scripts/azure/tests/ArchLucid.SecurityInventory.helpers.Tests.ps1'"
dotnet test ArchLucid.Core.Tests/ArchLucid.Core.Tests.csproj --filter 'FullyQualifiedName~AppSettingHost'
pwsh -NoProfile -File scripts/ci/agent-compile-check.ps1 -ProjectPath 'ArchLucid.Core/ArchLucid.Core.csproj'
```

Heartbeat every 8s if >15s. No full-solution build, no `npm ci`.

## Done when

Pester + Core tests prove Container Apps env hosts land in the companion without values. Hosted GET-only assertion exists.
