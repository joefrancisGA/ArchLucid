# DCH-03 — Discard the setting value before anything is written

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not use a fast-tier model.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/DECLARED_CONNECTION_HOST_LUNA_PROMPTS.md`

**Depends on:** DCH-01 and DCH-02. Do not re-run them. Do not edit the DCH index.

## Goal

After a setting is parsed, the raw value is gone. `app-settings-hosts.json`, completeness warnings, log lines, and exception text contain the site id, the setting name, and the parsed host only.

## Why

DCH-01 and DCH-02 read the secret in memory so the host can be kept. Trust in SecureNow covers that read. It does not cover a package, a warning banner, or a debug log that still holds the password. The companion writer in `Get-ArchLucidAzureAppSettingHostCompanionRows` already puts only parsed fields on the row. The empty `catch` must stay free of the response body, and the C# parser must not grow a value property.

## Read first

- `scripts/azure/ArchLucid.SecurityInventory.helpers.ps1` (`Get-ArchLucidAzureAppSettingHostCompanionRows`, `Add-ArchLucidAzureAppSettingHostCompanionRow`)
- `ArchLucid.Core/AzureExtractor/AzureInventoryAppSettingHostRow.cs`
- `ArchLucid.Core/AzureExtractor/AzureInventoryAppSettingHostRedactor.cs`
- The hosted and Tier 1 writers that serialize `app-settings-hosts.json`

## What to build

1. The row type has no property for the raw setting value, the password, the account key, or the shared access key. Parsing locals die at the end of the parse method.
2. A failed list call or a failed parse records the site resource id and, when known, the setting name. It does not record `response.Content`, the exception `ToString()` when that string might include the payload, or the setting value. The existing empty `catch` in the PowerShell list loop stays empty of payload. A warning string may name `microsoft.web/sites/config/list/action` and the site id.
3. Debug logs, when they exist, use the site id and the setting name. They do not use the value.
4. Add one ingest-style test that runs the PowerShell parser and the C# parser on a SQL string containing `Password=s3cret-value`, a storage string containing `AccountKey=s3cret-value`, and a Service Bus string containing `SharedAccessKey=s3cret-value`, serializes the rows, and fails if `s3cret-value` appears. Also fail if a warning built for a parse failure of those fixtures contains `s3cret-value`.

Do not add a new Azure call. Do not change who opts in. DCH-04 does that.

## Tests

1. Serialized companion rows for the three fixtures above do not contain `s3cret-value`.
2. They do contain the hostname from each fixture.
3. A row object in C# has no raw-value property. A test that reflects public properties fails if one is named like a secret or a full connection string.
4. The PowerShell `catch` in `Get-ArchLucidAzureAppSettingHostCompanionRows` does not interpolate `$response.Content` or the setting value into a warning.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- Compile once with `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Core.Tests/ArchLucid.Core.Tests.csproj'` and run the new tests plus the touched Pester file.
- Do not commit unless the user names the branch in that request.
- One class per file. No `ConfigureAwait(false)` in tests. Prefer concrete types over `var`. A blank line before `if` and `foreach` unless it is the first line in the method.
- Do not write to customer Azure.

## Done when

A secret that was present only so the host could be parsed is absent from every artifact this collector writes.
