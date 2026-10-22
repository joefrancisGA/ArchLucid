# DCH-04 — SecureNow opts in to declared connection hostnames

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not use a fast-tier model.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/DECLARED_CONNECTION_HOST_LUNA_PROMPTS.md`

**Depends on:** DCH-03. Do not re-run DCH-01 through DCH-03. Do not edit the DCH index.

## Goal

SecureNow collection reads App Service and Function app settings, keeps the host and target name, and discards the value. A Reader-only pull that does not opt in still skips `config/list` and still shows `app-settings-not-collected-hosted-get-only`. The diagrams page says which of those two things happened.

## Why

Subscription Reader cannot call `Microsoft.Web/sites/config/list/action`. That call returns every setting value. DCH-01 through DCH-03 make it safe to read those values in memory. The remaining gap is the choice. Tier 1 already has `-IncludeAppSettingsHosts`, and `Run-SecureNowAzureExtractor.ps1` plus `Run-ArchLucidAzureExtractor.ps1` already pass `$true`. Hosted pull never calls the list APIs, and the diagrams banner tells the operator that values are never collected.

## Read first

- `scripts/azure/Get-SecureNowAzurePackage.ps1` and `scripts/azure/Run-SecureNowAzureExtractor.ps1`
- `scripts/azure/Get-ArchLucidAzurePackage.ps1` and `scripts/azure/Run-ArchLucidAzureExtractor.ps1`
- `ArchLucid.Integrations.AzureExtractor/HostedAzureInventoryDiagramEnrichmentCollector.cs`
- `ArchLucid.Integrations.AzureExtractor/HostedAzureExtractorClient.cs` (`CollectDiagramEnrichmentAsync`)
- `ArchLucid.Integrations.AzureExtractor/GetOnlyHostedAzureArmReadClient.cs`
- `archlucid-ui/src/lib/infra-evidence/resolve-infra-evidence-completeness-warning-copy.ts`
- `docs/library/AZURE_EXTRACTOR.md` (the `-IncludeAppSettingsHosts` paragraph)

## What to build

1. Keep `-IncludeAppSettingsHosts` as the Tier 1 switch. Both quick starts stay opted in. Package comments and `docs/library/AZURE_EXTRACTOR.md` say the switch reads app settings and connection strings, stores the setting name plus the parsed host and target name, and discards the value. Name the least action: `microsoft.web/sites/config/list/action`. Do not tell the operator to grant Website Contributor.
2. Add `includeAppSettingsHosts` to the hosted collect path. The SecureNow hosted extract request passes true. A caller that omits the flag stays false.
3. When the hosted flag is false, behavior stays as it is today: no `config/list` call, and `app-settings-not-collected-hosted-get-only` is still recorded. Container Apps environment variables stay on the existing ARM GET.
4. When the hosted flag is true, POST `config/appsettings/list` and `config/connectionstrings/list` for each `Microsoft.Web/sites` resource, using the DCH-01 parser. On 403, record a warning that names the site id and `microsoft.web/sites/config/list/action`, continue the rest of the pull, and do not include the response body. When the operator opted in, do not also emit `app-settings-not-collected-hosted-get-only`.
5. Keep `GetOnlyHostedAzureArmReadClient` from becoming a general POST client. Add one method whose only paths are those two list actions, and call it only from the app-setting collector when the flag is true.
6. Update the diagrams copy for `app-settings-not-collected-hosted-get-only`. Say that this pull did not read app settings, and that opting in reads them, keeps the hostname and target name, and discards the value. The 403 warning says the identity is missing `microsoft.web/sites/config/list/action` on that site.
7. Hostname edges stay on the existing inferred path. Do not mark them observed.

Do not POST `config/list` for Container Apps. Do not GET Key Vault secrets. Do not scrape Kudu.

## Tests

1. Hosted collection with the flag false writes no app-setting list request and still emits `app-settings-not-collected-hosted-get-only`.
2. Hosted collection with the flag true sends the two list calls, writes a host row for a SQL string that contains `Password=s3cret-value`, and the zip bytes do not contain `s3cret-value`. The GET-only warning is absent.
3. A 403 on one site adds the missing-action warning for that site id and does not fail the package. The warning text does not contain a setting value.
4. `Run-SecureNowAzureExtractor.ps1` still contains `IncludeAppSettingsHosts = $true`.
5. The diagrams warning presentation for the GET-only code no longer says that values are never collected. It says the value is discarded when the operator opts in.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- Compile once with `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Integrations.AzureExtractor.Tests/ArchLucid.Integrations.AzureExtractor.Tests.csproj'` and run the hosted extractor tests plus the touched UI test for the warning copy.
- Do not commit unless the user names the branch in that request.
- One class per file. No `ConfigureAwait(false)` in tests. Prefer concrete types over `var`. A blank line before `if` and `foreach` unless it is the first line in the method.
- Do not write to customer Azure.

## Done when

SecureNow's next opted-in collection can draw an inferred line from a connection string, the password is not in the package, and a Reader-only pull still says that app settings were not read.
