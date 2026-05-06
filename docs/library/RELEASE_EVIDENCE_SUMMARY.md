# Release evidence summary (operator)

Use this drill after a candidate release build to gather **signals** (not a substitute for full CI). Prefer running from repo root on Windows (PowerShell).

## What to run

1. **API + health**

   ```powershell
   dotnet test .\ArchLucid.Api.Tests\ArchLucid.Api.Tests.csproj --filter "FullyQualifiedName~Health" --no-build:$false
   ```

   Or against a live host: `archlucid health` (from a directory with `archlucid.config.json` / env pointing at the API).

2. **OpenAPI contract snapshot** (locks public HTTP contract)

   ```powershell
   dotnet test .\ArchLucid.Api.Tests\ArchLucid.Api.Tests.csproj --filter "FullyQualifiedName~OpenApiContractSnapshot" --no-build:$false
   ```

3. **UI smoke** (when SQL-backed live API is available — see `docs/library/LIVE_E2E_HAPPY_PATH.md`)

   ```powershell
   npx playwright test --config archlucid-ui/playwright.live.config.ts
   ```

4. **Optional live Azure OpenAI gate** (skips when env vars unset)

   ```powershell
   .\scripts\Invoke-RealLlmEvidenceGate.ps1
   ```

5. **Aggregated script** (non-fatal collection)

   ```powershell
   .\scripts\Invoke-ReleaseEvidenceSummary.ps1
   ```

## Interpretation

- Collect logs + exit codes; a single failing gate blocks calling the build “fully verified” for that dimension.
- Buyer-safe reference packaging still requires human review of the first-value report **buyer-safe gate** section and proof sendability.
