# SN-RT-02 — Setting value parser (Option A)

**Wave:** SecureNow runtime connections (**SN-RT**). **Option A.** **Depends on:** SN-RT-01 row shape (or stub parser tests against strings). **Do not** implement SN-RT-03–10.

Do not implement from the wave index. Implement only *What to build*.

## Goal

Parse **hosts**, **SQL catalog names**, and **Key Vault URI hosts** from setting values without keeping the values. Cover connection strings **and** bare `https://` URLs used on Container Apps.

## Why

Today `Get-ArchLucidAzureAppSettingHostFromValue` only matches `Server=tcp:` and `@Microsoft.KeyVault(SecretUri=...)`. ArchLucid DEV uses:

- `Server=tcp:<srv>.database.windows.net;Initial Catalog=<db>` (catalog dropped)
- `https://<acct>.blob.core.windows.net/`
- `https://<vault>.vault.azure.net/`
- `https://<api>.<region>.azurecontainerapps.io`

Without catalog and HTTPS parse, SN-RT-01 still cannot draw SQL databases or blob/KV.

## Context

- `scripts/azure/ArchLucid.SecurityInventory.helpers.ps1` (`Get-ArchLucidAzureAppSettingHostFromValue`)
- `ArchLucid.Core/AzureExtractor/AzureInventoryAppSettingHostParser.cs`
- `ArchLucid.Core/AzureExtractor/AzureInventoryAppSettingHostRow.cs` (add optional `catalog` / `initialCatalog` field if missing)
- `docs/securenow/RUNTIME_DECLARED_AND_OBSERVED_DATA_FLOWS.md`

## What to build

1. Shared parse rules (PowerShell + C# ingest must agree — prefer one documented regex set; duplicate with tests that lock both):
   - `Server=` / `Server=tcp:` → host (existing)
   - `Initial Catalog=` **or** `Database=` → catalog (trimmed, no `{0}` expansion here)
   - `https://host/` or `https://host` → host (lowercase)
   - `*.vault.azure.net` on a URL → `keyVaultHost`
   - Keep `@Microsoft.KeyVault(...)` extractors
2. `{0}` / `{tenant}` placeholders: persist catalog as **null** and a warning code `app-settings-catalog-template` (SN-RT-03 must not invent database names).
3. Redactor: still reject values that look like keys/passwords **after** extracting host/catalog. Do not persist the raw value.
4. Tests:
   - SQL connection string → host + catalog `archlucid`, no password in row.
   - `https://starchlucidevarts.blob.core.windows.net/` → host `starchlucidevarts.blob.core.windows.net`.
   - `https://kvrgexample.vault.azure.net/` → keyVaultHost.
   - `https://archlucid-api.xxx.azurecontainerapps.io` → host.
   - Template `Initial Catalog={0}` → host only + warning, catalog null.
   - Secret-like remaining payload still rejected.

## Acceptance criteria

Parser unit tests cover SQL catalog + three HTTPS shapes. No value persistence. Template catalogs are not invented.

## Constraints

- Working-tree check before edits. Exit 2 → skip.
- Do **not** resolve ARM ids (SN-RT-03). Do **not** collect Azure.
- Stage only this prompt’s paths. **No `git add -A`.**
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.

## Verification

```bash
dotnet test ArchLucid.Core.Tests/ArchLucid.Core.Tests.csproj --filter 'FullyQualifiedName~AppSettingHost'
pwsh -NoProfile -Command "Invoke-Pester -Strict -EnableExit -Path 'scripts/azure/tests/ArchLucid.SecurityInventory.helpers.Tests.ps1'"
pwsh -NoProfile -File scripts/ci/agent-compile-check.ps1 -ProjectPath 'ArchLucid.Core/ArchLucid.Core.csproj'
```

Heartbeat every 8s if >15s.

## Done when

Both PS and C# parse catalog + HTTPS hosts. Redaction tests still fail closed.
