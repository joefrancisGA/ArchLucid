# DCH-01 — Keep the host when the setting also contains a secret

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not use a fast-tier model.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/DECLARED_CONNECTION_HOST_LUNA_PROMPTS.md`

**Depends on:** AX-DE-18, already shipped. Do not re-run it. Do not edit the DCH index.

## Goal

A SQL connection string that contains `Password=`, and a Key Vault reference that contains a secret name, still produce a row with the hostname, catalog, vault host, and secret name. The password and the secret value are not fields on that row.

## Why

`AzureInventoryAppSettingHostRedactor.TryParseSettingValue` and `Get-ArchLucidAzureAppSettingHostFromValue` return null as soon as `ShouldRejectValue` or `Test-ArchLucidAzureAppSettingHostRejectedValue` sees `Password=`, `AccountKey=`, `SharedAccessKey=`, `token=`, `secret=`, or `key=`. The host sits in the same string as the password, so the diagram never learns the target. SecureNow can read that string in memory. The stored evidence is the target, not the secret.

## Read first

- `ArchLucid.Core/AzureExtractor/AzureInventoryAppSettingHostRedactor.cs`
- `ArchLucid.Core.Tests/AzureExtractor/AzureInventoryAppSettingHostRedactorTests.cs`
- `scripts/azure/ArchLucid.SecurityInventory.helpers.ps1` (`Test-ArchLucidAzureAppSettingHostRejectedValue`, `Get-ArchLucidAzureAppSettingHostFromValue`)
- `scripts/azure/tests/ArchLucid.SecurityInventory.helpers.Tests.ps1` (the test named `rejects app setting values that contain password markers`)

## What to build

1. Parse `Server=tcp:{host}`, `Initial Catalog` / `Database`, and `@Microsoft.KeyVault(SecretUri=https://{vault}/secrets/{name})` even when the same value contains a secret marker.
2. Keep the existing row shape: setting name, host, catalog, Key Vault host, secret name, warning code. Do not add a value column.
3. A value that is only a secret marker and has no host, catalog, or Key Vault reference still returns null. `AccountKey=abc` alone is not a row.
4. Leave `ShouldRejectValue` and `Test-ArchLucidAzureAppSettingHostRejectedValue` as detectors. They must not skip parsing. Tests may call them to prove a marker was present, then prove the serialized row does not contain that marker's secret text.
5. Apply the same rule in C# and in PowerShell. The two parsers stay aligned.
6. Update `ShouldRejectValue_blocks_secret_like_content` and the Pester test that expects `$null` for `Server=tcp:sql.database.windows.net;Password=secret`. That input yields host `sql.database.windows.net`. The JSON of the row does not contain `Password=` or `secret`.

Do not add storage, Service Bus, Event Hub, Cosmos, or Redis shapes in this session. DCH-02 does that. Do not change hosted collection. Do not call Azure.

## Tests

1. `Server=tcp:prodsql.database.windows.net,1433;Initial Catalog=archlucid;Password=secret` yields host `prodsql.database.windows.net` and catalog `archlucid` in both parsers. The serialized row does not contain `secret`.
2. `@Microsoft.KeyVault(SecretUri=https://myvault.vault.azure.net/secrets/sql-password)` still yields vault host `myvault.vault.azure.net` and secret name `sql-password`.
3. `AccountKey=abc` and `SharedAccessKey=abc` with no host still yield no row.
4. The existing password-free SQL, blob URL, vault URL, Container Apps URL, and `{0}` catalog cases still pass.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- Compile once with `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Core.Tests/ArchLucid.Core.Tests.csproj'` and run the redactor tests plus the touched Pester file.
- Do not commit unless the user names the branch in that request.
- One class per file. No `ConfigureAwait(false)` in tests. Prefer concrete types over `var`. A blank line before `if` and `foreach` unless it is the first line in the method.
- Do not write to customer Azure. Do not read Key Vault secret values.

## Done when

A connection string that contains a password still contributes its SQL host and catalog, and the stored row has no password.
