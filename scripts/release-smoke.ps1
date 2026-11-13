# End-to-end release smoke: Release build, core tests, optional UI, API+CLI+artifacts; optional -RunPlaywright (mock) and -LivePlaywright (live-api parity vs CI ui-e2e-live).
# Named profiles LiveUiSql / ReleaseCandidate: same gates + enforced live playwright (browser UI vs smoke SQL API). ReleaseCandidate requires -ResultOut.
# Optional -AuthorityPipelineDtfSmoke: sets ArchLucid__AuthorityPipeline__OrchestratorBackend=DurableTask for the temporary API (requires ArchLucid__AuthorityPipeline__DurableTask__GrpcEndpoint in the environment — staging SQL + DTF worker validation).
# Full detail: docs/library/RELEASE_SMOKE.md
param(
    [ValidateSet('', 'LiveUiSql', 'ReleaseCandidate')]
    [string] $Profile = '',
    [string] $SqlConnectionString = '',
    [Alias('BaseUrl')]
    [string] $ApiBaseUrl = 'http://localhost:5128',
    [switch] $SkipE2E,
    [switch] $SkipUi,
    [switch] $FullCore,
    [switch] $RunPlaywright,
    [switch] $LivePlaywright,
    [switch] $AuthorityPipelineDtfSmoke,

    [string] $BearerToken = '',

    [string] $ApiKey = '',

    [string] $ResultOut = ''
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
. (Join-Path $PSScriptRoot 'OperatorDiagnostics.ps1')
. (Join-Path $PSScriptRoot 'ArchLucid.AuthHeaders.ps1')

# Cloud Agent / some hosts set OTEL_SDK_DISABLED=true. That makes Sdk.CreateTracerProviderBuilder().Build()
# return NoopTracerProvider (no Sampler), so Core ObservabilityTraceSamplingConfiguratorTests fail closed.
# Clear for this process and the temporary API child so Gate 1 smoke and Core suite stay honest.
if ($env:OTEL_SDK_DISABLED -eq 'true') {
    Write-Host 'Clearing OTEL_SDK_DISABLED=true for release-smoke (OpenTelemetry SDK must be active for Core sampler tests + API traces).' -ForegroundColor DarkYellow
    Remove-Item Env:\OTEL_SDK_DISABLED -ErrorAction SilentlyContinue
}

$releaseSmokeAuthHeaders = Get-ArchLucidHttpAuthHeadersHashtable -BearerToken $BearerToken -ApiKey $ApiKey

$runLiveUiSqlProfile = ($Profile -eq 'LiveUiSql' -or $Profile -eq 'ReleaseCandidate')

if ($runLiveUiSqlProfile -and [string]::IsNullOrWhiteSpace($ResultOut)) {
    Write-OperatorFailureTriage -Stage '-Profile (precheck — ResultOut)' -Category 'Misconfiguration' `
        -Details @(
        'Live UI vs SQL parity profiles require -ResultOut for RC machine-readable evidence (JSON + Markdown companion).'
    ) `
        -NextSteps @(
        '-ResultOut artifacts/release-smoke/result.json',
        'Use scripts/release-smoke-rc.ps1 as the RC convenience wrapper (sets profile + reminds on ResultOut).'
    )
    exit 1
}

if ($runLiveUiSqlProfile) {
    if ($SkipUi) {
        Write-OperatorFailureTriage -Stage '-Profile LiveUiSql (precheck)' -Category 'Misconfiguration' `
            -Details @(
            'Live UI vs SQL parity needs a production Next build (.next/standalone) for live Playwright (see LIVE_E2E_SKIP_NEXT_BUILD in playwright.config.ts).'
        ) `
            -NextSteps @('Omit -SkipUi for this profile, or run -LivePlaywright without -Profile when you intentionally skip UI.')
        exit 1
    }

    if ($SkipE2E) {
        Write-OperatorFailureTriage -Stage '-Profile LiveUiSql (precheck)' -Category 'Misconfiguration' `
            -Details @('This profile expects the smoke-started ArchLucid.Api + SQL (steps 5–7) before live-api Playwright.')
            -NextSteps @('Omit -SkipE2E, or use plain release-smoke with -SkipE2E for build-only.')
        exit 1
    }
}

if ([bool]$AuthorityPipelineDtfSmoke.IsPresent) {
    if ($SkipE2E) {
        Write-OperatorFailureTriage -Stage '-AuthorityPipelineDtfSmoke (precheck)' -Category 'Misconfiguration' `
            -Details @('DTF SQL smoke requires the temporary API + tenant SQL (omit -SkipE2E).') `
            -NextSteps @('Run without -SkipE2E', 'Set ARCHLUCID_SMOKE_SQL or -SqlConnectionString')
        exit 1
    }

    $grpcPrecheck = $env:ArchLucid__AuthorityPipeline__DurableTask__GrpcEndpoint

    if ([string]::IsNullOrWhiteSpace($grpcPrecheck)) {
        Write-OperatorFailureTriage -Stage '-AuthorityPipelineDtfSmoke (precheck — gRPC)' -Category 'Misconfiguration' `
            -Details @(
            'DTF backend requires a reachable Durable Task gRPC endpoint for the temporary API process.'
        ) `
            -NextSteps @(
            '$env:ArchLucid__AuthorityPipeline__DurableTask__GrpcEndpoint = ''https://<your-durable-task-worker>:<port>'''
        )
        exit 1
    }

    Write-Host ''
    Write-Host '--- Authority pipeline: DTF smoke mode (OrchestratorBackend=DurableTask for started API) ---' -ForegroundColor DarkCyan
}

$runLivePlaywrightEffective = ([bool]$LivePlaywright.IsPresent -or $runLiveUiSqlProfile)

function Get-ResolvedReleaseSmokeSqlConnectionString {
    param([string]$FromParam)

    if (-not [string]::IsNullOrWhiteSpace($FromParam)) {
        return $FromParam.Trim()
    }

    if (-not [string]::IsNullOrWhiteSpace($env:ARCHLUCID_SMOKE_SQL)) {
        return $env:ARCHLUCID_SMOKE_SQL.Trim()
    }

    if (-not [string]::IsNullOrWhiteSpace($env:ConnectionStrings__ArchLucid)) {
        return $env:ConnectionStrings__ArchLucid.Trim()
    }

    return ''
}

# pwsh cannot Add-Type load net10 Microsoft.Data.SqlClient on Linux (System.Runtime 9/10 mismatch).
# tools/ArchLucid.SqlScalar runs under dotnet and prints one scalar to stdout.
function Invoke-ReleaseSmokeSqlScalar {
    param(
        [Parameter(Mandatory = $true)][string] $RepoRoot,
        [Parameter(Mandatory = $true)][string] $ConnectionString,
        [Parameter(Mandatory = $true)][string] $Sql
    )

    $proj = Join-Path $RepoRoot 'tools/ArchLucid.SqlScalar/ArchLucid.SqlScalar.csproj'
    $dll = Join-Path $RepoRoot 'tools/ArchLucid.SqlScalar/bin/Release/net10.0/ArchLucid.SqlScalar.dll'

    if (-not (Test-Path -LiteralPath $dll)) {
        & dotnet build $proj -c Release --nologo -v q

        if ($LASTEXITCODE -ne 0) {
            throw "dotnet build tools/ArchLucid.SqlScalar failed (exit $LASTEXITCODE)."
        }
    }

    if (-not (Test-Path -LiteralPath $dll)) {
        throw "ArchLucid.SqlScalar.dll missing after build: $dll"
    }

    $raw = & dotnet exec $dll $ConnectionString $Sql 2>&1

    if ($LASTEXITCODE -ne 0) {
        throw "ArchLucid.SqlScalar failed (exit $LASTEXITCODE): $raw"
    }

    return ([string]$raw).Trim()
}

if ($runLiveUiSqlProfile -and (-not $SkipE2E)) {
    $csPrecheck = Get-ResolvedReleaseSmokeSqlConnectionString -FromParam $SqlConnectionString

    if ([string]::IsNullOrWhiteSpace($csPrecheck)) {
        Write-OperatorFailureTriage -Stage '-Profile LiveUiSql (precheck — SQL)' -Category 'Misconfiguration' `
            -Details @('-Profile LiveUiSql requires a tenant SQL connection string before the long-release path runs.') `
            -NextSteps @(
            '$env:ARCHLUCID_SMOKE_SQL = ''Server=...;Database=...;...''',
            '-SqlConnectionString ''…''',
            '$env:ConnectionStrings__ArchLucid = ''…'''
        )
        exit 1
    }

    $nodePrecheck = Get-Command node -ErrorAction SilentlyContinue

    if ($null -eq $nodePrecheck) {
        Write-OperatorFailureTriage -Stage '-Profile LiveUiSql (precheck — Node.js)' -Category 'Misconfiguration' `
            -Details @('-Profile LiveUiSql needs Node.js for archlucid-ui and Playwright (live-api-*.spec.ts).')
            -NextSteps @('Install Node.js 22+ on PATH', 'Then re-run .\scripts\release-smoke.ps1 -Profile LiveUiSql')
        exit 1
    }
}

# Prefer npm.cmd on Windows under StrictMode (npm.ps1 can throw on $MyInvocation.Statement).
$releaseSmokeNpm = if (Get-Command npm.cmd -ErrorAction SilentlyContinue) { 'npm.cmd' } else { 'npm' }
$sln = Join-Path $root 'ArchLucid.sln'
$apiProj = Join-Path $root 'ArchLucid.Api\ArchLucid.Api.csproj'
$cliProj = Join-Path $root 'ArchLucid.Cli\ArchLucid.Cli.csproj'

$savedConn = $env:ConnectionStrings__ArchLucid
$savedApiUrl = $env:ARCHLUCID_API_URL
$savedArchLucidApiKeyForSmoke = $env:ARCHLUCID_API_KEY
$script:releaseSmokeSetApiKeyFromParam = (-not [string]::IsNullOrWhiteSpace($ApiKey))

if ($script:releaseSmokeSetApiKeyFromParam) {
    $env:ARCHLUCID_API_KEY = $ApiKey.Trim()
}

$apiProc = $null
$tempRoot = $null

function Restore-Env
{
    if ($null -eq $savedConn) { Remove-Item Env:\ConnectionStrings__ArchLucid -ErrorAction SilentlyContinue }
    else { $env:ConnectionStrings__ArchLucid = $savedConn }

    if ($null -eq $savedApiUrl) { Remove-Item Env:\ARCHLUCID_API_URL -ErrorAction SilentlyContinue }
    else { $env:ARCHLUCID_API_URL = $savedApiUrl }

    if ($script:releaseSmokeSetApiKeyFromParam) {

        if ($null -eq $savedArchLucidApiKeyForSmoke -or [string]::IsNullOrWhiteSpace($savedArchLucidApiKeyForSmoke)) {
            Remove-Item Env:\ARCHLUCID_API_KEY -ErrorAction SilentlyContinue
        }
        else {
            $env:ARCHLUCID_API_KEY = $savedArchLucidApiKeyForSmoke
        }
    }
}

function Ensure-ReleaseSmokePlaywrightChromiumBrowsersInstalled {
    param(
        [Parameter(Mandatory = $true)][string] $UiRoot,
        [Parameter(Mandatory = $true)][string] $NpmExe,
        [Parameter(Mandatory = $true)][string] $TriageStage
    )

    Push-Location $UiRoot
    try {
        Write-Host ''
        Write-Host '--- Playwright: ensure Chromium binaries (repeatable noop if already cached) ---' -ForegroundColor DarkGray
        & $NpmExe exec playwright install chromium
        if ($LASTEXITCODE -ne 0) {
            Write-OperatorFailureTriage -Stage $TriageStage -Category 'PlaywrightMisconfiguration' `
                -Details @("npm exec playwright install chromium exited $LASTEXITCODE (first-time downloads need outbound network permission).") `
                -NextSteps @(
                'cd archlucid-ui; npx playwright install chromium',
                'archlucid-ui/docs/TESTING_AND_TROUBLESHOOTING.md — E2E tests (mock vs live parity), section 8'
            )
            exit $LASTEXITCODE
        }
    }
    finally {
        Pop-Location
    }
}

function Publish-ReleaseSmokeRcCanonicalArtifacts {
    param(
        [Parameter(Mandatory = $true)][string] $ResultOutPath,
        [Parameter(Mandatory = $true)][string] $ExpectedProfile
    )

    if (-not (Test-Path -LiteralPath $ResultOutPath)) {
        return
    }

    $resultDir = Split-Path -Parent $ResultOutPath
    $canonicalJson = Join-Path $resultDir 'release-smoke-live-ui-sql-result.json'
    $canonicalMd = [System.IO.Path]::ChangeExtension($canonicalJson, '.md')
    $sourceMd = [System.IO.Path]::ChangeExtension($ResultOutPath, '.md')

    if ($canonicalJson -ne $ResultOutPath) {
        Copy-Item -LiteralPath $ResultOutPath -Destination $canonicalJson -Force
    }

    if ((Test-Path -LiteralPath $sourceMd) -and ($canonicalMd -ne $sourceMd)) {
        Copy-Item -LiteralPath $sourceMd -Destination $canonicalMd -Force
    }

    & (Join-Path $PSScriptRoot 'Assert-ReleaseSmokeRcResult.ps1') `
        -ResultPath $ResultOutPath `
        -ExpectedProfile $ExpectedProfile

    if ($LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }
}

function Write-ReleaseSmokeResultArtifact {
    param(
        [Parameter(Mandatory = $true)][ValidateSet('Pass', 'Partial')][string] $Verdict,
        [Parameter(Mandatory = $true)][string] $ResultOutPath,
        [bool] $SkipE2E,
        [bool] $FullCore,
        [bool] $RanUiVitestAndProductionBuild,
        [bool] $SkippedUiExplicitly,
        [bool] $RanApiCliArtifacts,
        [bool] $RanRunExportOutbox,
        [bool] $RanProductionLikeConfigLint,
        [bool] $RanMockPlaywright,
        [bool] $RanLivePlaywright,
        [string] $ApiBaseUrlEvidence,
        [string] $ProfileName,
        [bool] $RanShipGateEvidence = $false
    )

    if ([string]::IsNullOrWhiteSpace($ResultOutPath)) {
        return
    }

    $checks = @(
        @{ Name = 'Release build'; Result = 'Passed'; Detail = 'ArchLucid.sln Release gate' }
    )

    if ($RanProductionLikeConfigLint) {
        $checks += @{ Name = 'Production-like config lint'; Result = 'Passed'; Detail = 'profile production-like-hosted-pilot; RC baseline fixture' }
    }

    $checks += @{ Name = 'Fast core tests'; Result = 'Passed'; Detail = 'Suite=Core excluding Slow and Integration' }

    if ($FullCore) {
        $checks += @{ Name = 'Full core tests'; Result = 'Passed'; Detail = '-FullCore lane' }
    }

    if ($RanUiVitestAndProductionBuild) {
        $checks += @{ Name = 'UI Vitest + production build'; Result = 'Passed'; Detail = 'archlucid-ui npm test + next build' }
    }
    elseif ($SkippedUiExplicitly) {
        $checks += @{ Name = 'UI Vitest + production build'; Result = 'Skipped'; Detail = '-SkipUi' }
    }

    if ($SkipE2E) {
        $checks += @{ Name = 'SQL-backed API + CLI artifact gate'; Result = 'Skipped'; Detail = '-SkipE2E' }
        $checks += @{ Name = 'Run-export durable outbox'; Result = 'Skipped'; Detail = '-SkipE2E' }
    }
    elseif ($RanApiCliArtifacts) {
        $checks += @{ Name = 'SQL-backed API + CLI artifact gate'; Result = 'Passed'; Detail = "Temporary API @ $ApiBaseUrlEvidence" }
        if ($RanRunExportOutbox) {
            $checks += @{ Name = 'Run-export durable outbox'; Result = 'Passed'; Detail = 'Enqueue, worker processing, and expected dead-letter outcome' }
        }
    }

    if ($RanMockPlaywright) {
        $checks += @{ Name = 'Mock Playwright lane'; Result = 'Passed'; Detail = 'npm run test:e2e mock config' }
    }

    if ($RanLivePlaywright) {
        $checks += @{ Name = 'Live Playwright parity'; Result = 'Passed'; Detail = 'live-api / demo workspace smoke' }
    }

    if ($RanShipGateEvidence) {
        $checks += @{ Name = 'Ship-gate evidence artifact'; Result = 'Passed'; Detail = 'archlucid pilot ship-gate-evidence JSON + Markdown under artifacts/ship-gate-evidence/' }
    }

    $mdOut = [System.IO.Path]::ChangeExtension($ResultOutPath, '.md')
    & (Join-Path $PSScriptRoot 'Write-ReleaseSmokeResultReport.ps1') `
        -ResultJsonOut $ResultOutPath `
        -ResultMarkdownOut $mdOut `
        -Verdict $Verdict `
        -BaseUrl $ApiBaseUrlEvidence `
        -Profile $ProfileName `
        -Checks $checks
}

function Invoke-ReleaseSmokeShipGateEvidence {
    param(
        [Parameter(Mandatory = $true)][string] $RunId,
        [Parameter(Mandatory = $true)][string] $ApiBaseUrl,
        [Parameter(Mandatory = $true)][string] $RepoRoot,
        [Parameter(Mandatory = $true)][string] $CliProj
    )

    if ([string]::IsNullOrWhiteSpace($RunId)) {
        return $false
    }

    $artifactDir = Join-Path $RepoRoot ("artifacts/ship-gate-evidence/" + $RunId.Trim())
    New-Item -ItemType Directory -Path $artifactDir -Force | Out-Null
    $jsonOut = Join-Path $artifactDir 'ship-gate-evidence.json'
    $mdOut = Join-Path $artifactDir 'ship-gate-evidence.md'

    $previousApiUrl = $env:ARCHLUCID_API_URL
    $env:ARCHLUCID_API_URL = $ApiBaseUrl.TrimEnd('/')

    Push-Location $RepoRoot
    try {
        Write-Host ''
        Write-Host '--- Ship-gate evidence (archlucid pilot ship-gate-evidence) ---' -ForegroundColor DarkGray
        dotnet run --project $CliProj -- pilot ship-gate-evidence `
            --run-id $RunId `
            --json-out $jsonOut `
            --markdown-out $mdOut `
            --skip-claim-lint

        if ($LASTEXITCODE -ne 0) {
            Write-Host "Ship-gate evidence CLI exited $LASTEXITCODE (artifact may be partial)." -ForegroundColor Yellow
            return $false
        }
    }
    finally {
        Pop-Location

        if ($null -eq $previousApiUrl) {
            Remove-Item Env:ARCHLUCID_API_URL -ErrorAction SilentlyContinue
        }
        else {
            $env:ARCHLUCID_API_URL = $previousApiUrl
        }
    }

    $schemaScript = Join-Path $PSScriptRoot 'ci/assert_ship_gate_evidence_schema.py'
    if ((Test-Path -LiteralPath $jsonOut) -and (Test-Path -LiteralPath $schemaScript)) {
        python3 $schemaScript $jsonOut
        if ($LASTEXITCODE -ne 0) {
            Write-Host 'Ship-gate evidence schema validation failed.' -ForegroundColor Yellow
            return $false
        }
    }

    Write-Host "Ship-gate evidence artifact: $jsonOut" -ForegroundColor Green
    return $true
}

function Write-ReleaseSmokeEvidenceSummary {
    param(
        [Parameter(Mandatory = $true)][ValidateSet('SkipE2EEarly', 'Complete')][string] $ExitMode,
        [bool] $LiveUiSqlProfile,
        [bool] $RanFastCoreGate,
        [bool] $RanFullCore,
        [bool] $RanUiVitestAndProductionBuild,
        [bool] $SkippedUiExplicitly,
        [bool] $RanApiCliArtifacts,
        [bool] $RanRunExportOutbox,
        [bool] $RanProductionLikeConfigLint,
        [bool] $RanMockPlaywright,
        [bool] $RanLivePlaywrightRequestedButSkipped,
        [bool] $RanLivePlaywright,
        [string] $ApiBaseUrlEvidence
    )

    Write-Host ''
    Write-Host '=== Release smoke evidence summary (what ran vs not) ===' -ForegroundColor Cyan

    Write-Host ''
    Write-Host 'Validated this run:'
    Write-Host '  - Release solution build gate (step 1/8)'

    if ($RanProductionLikeConfigLint) {
        Write-Host '  - Production-like config lint (profile production-like-hosted-pilot; artifacts/release-readiness/)'
    }

    if ($RanFastCoreGate) {
        Write-Host '  - Fast Core dotnet tests Release (Suite=Core excluding Slow and Integration)'
    }

    if ($RanFullCore) {
        Write-Host '  - Full Core dotnet tests Release (-FullCore)'
    }

    if ($RanUiVitestAndProductionBuild) {
        Write-Host '  - archlucid-ui Vitest + production next build (.next)'
    }

    if ($SkippedUiExplicitly) {
        Write-Host '  - (skipped) Operator UI npm / Vitest / build - explicit -SkipUi'
    }

    if ((-not $SkippedUiExplicitly) -and (-not $RanUiVitestAndProductionBuild)) {
        Write-Host '  - (skipped) Operator UI - Node.js missing from PATH'
    }

    if ($RanApiCliArtifacts) {
        Write-Host ('  - Temporary ArchLucid.Api (Release, StorageProvider=Sql) backed by tenant SQL from ARCHLUCID_SMOKE_SQL / -SqlConnectionString / ConnectionStrings__ArchLucid')
        Write-Host ('  - GET /health/ready + /health/live; CLI new + HTTP Gate 1 create→commit against ' + $ApiBaseUrlEvidence)
        Write-Host '  - Manifest + synthesized artifacts via HTTP (at least one descriptor)'
    }

    if ($RanRunExportOutbox) {
        Write-Host '  - Run-export durable outbox (blob push enqueue, worker poll, processing success via GET run)'
    }

    Write-Host ''

    Write-Host 'Not asserted / not run this invocation:'
    if (-not $RanApiCliArtifacts) {
        Write-Host '  - SQL-backed smoke API + CLI artifact gate - omit -SkipE2E and supply tenant SQL'
        Write-Host '  - Run-export durable outbox (requires API gate)'
    }

    if ($ExitMode -eq 'SkipE2EEarly') {
        Write-Host '  - Playwright lanes (stopped before steps 6-8 because -SkipE2E)'

        if ($RanLivePlaywrightRequestedButSkipped) {
            Write-Host '  - Note: playwright-related switches have no effect with -SkipE2E'
        }
    }

    Write-Host ''

    if ($ExitMode -eq 'SkipE2EEarly') {
        Write-Host 'How this maps to documented lanes:'
        Write-Host '  - CI-style mock UI E2E - archlucid-ui npm run test:e2e (playwright.mock.config.ts)'
        Write-Host '  - Named UI-SQL parity - release-smoke-live-ui-sql.cmd wraps -Profile LiveUiSql'
        Write-Host '  - Ad hoc parity switch - add -LivePlaywright (same SQL prerequisites as steps 6-8)'
        Write-Host '  - CI live E2E - ui-e2e-live* workflows, playwright.config.ts (live-api-*, demo-workspace-*.smoke, tagged @release-gate)'

        Write-Host ''

        Write-Host '(With -SkipE2E only build + dotnet tests (+ optional UI). Full ladder: docs/library/RELEASE_SMOKE.md.)'

        return
    }

    if (-not $RanMockPlaywright) {
        Write-Host '  - Mock Playwright lane (npm run test:e2e mock config) unless -RunPlaywright'
    }

    if (-not $RanLivePlaywright) {
        Write-Host '  - Chromium live-api-* parity vs this smoke API - add -Profile LiveUiSql / release-smoke-live-ui-sql.ps1 / -LivePlaywright'

        Write-Host ''

        Write-Host 'Auditor citation: plain release smoke does not bundle browser-vs-SQL parity; use -Profile LiveUiSql for that claim.'

        return
    }

    Write-Host ''

    Write-Host 'Playwright live parity exercised this run:'
    if ($LiveUiSqlProfile) {
        Write-Host '  - Via -Profile LiveUiSql (same specs as CI ui-e2e-live: live-api-* + demo workspace smoke)'
    }
    else {
        Write-Host '  - Via -LivePlaywright (playwright.config.ts and LIVE_API_URL follows -ApiBaseUrl)'
    }

    Write-Host '  - LIVE_API_KEY / LIVE_JWT_TOKEN optional - auth-heavy specs skip when unset (parity with CI).'

    Write-Host ''

    Write-Host 'How this maps to documented lanes:'
    Write-Host '  - Mock stack - -RunPlaywright runs npm run test:e2e (mock Playwright config)'

    $paritySwitchVerb = '-LivePlaywright'

    if ($LiveUiSqlProfile) {
        $paritySwitchVerb = '-Profile LiveUiSql'
    }

    Write-Host ('  - Live UI-SQL claim - ' + $paritySwitchVerb + ' against the same smoke-started API as steps 6-8')

    Write-Host '  - CI ui-e2e-live* UI prebuild plus LIVE_E2E_SKIP_NEXT_BUILD, aligned to playwright.config.ts live-api + GA demo selections'
}

function Invoke-ReleaseSmokePlaywrightWhenRequested
{
    param(
        [string] $RepoRoot,
        [switch] $RunPlaywright,
        [switch] $LivePlaywright,
        [string] $ApiBaseUrl,
        [switch] $UiSkipped,
        [switch] $SkipE2E
    )

    if (-not $RunPlaywright -and -not $LivePlaywright) { return }

    if ($LivePlaywright -and $SkipE2E) {
        Write-Warning ('Live parity (-LivePlaywright or -Profile LiveUiSql) skipped: E2E steps did not run (API was not started). Omit -SkipE2E for UI-vs-smoke-SQL parity against the temporary API.')
        if (-not $RunPlaywright) { return }
    }

    $uiRoot = Join-Path $RepoRoot 'archlucid-ui'
    $node = Get-Command node -ErrorAction SilentlyContinue

    if ($null -eq $node) {
        Write-OperatorFailureTriage -Stage 'Playwright E2E' -Category 'Misconfiguration' `
            -Details @('-RunPlaywright, -LivePlaywright, or -Profile LiveUiSql require Node.js on PATH.') `
            -NextSteps @('Install Node 22+ or omit Playwright / profile switches')
        exit 1
    }

    $savedCi = $env:CI

    function Invoke-MockPlaywrightBlock
    {
        Write-Host ''
        Write-Host '=== Playwright E2E (opt-in: -RunPlaywright, mock loopback) ===' -ForegroundColor Cyan
        Push-Location $uiRoot
        try {
            if ($UiSkipped -or -not (Test-Path (Join-Path $uiRoot 'node_modules')))
            {
                Write-Host 'Installing UI dependencies (npm ci) for Playwright...'
                & $releaseSmokeNpm ci
                if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
            }

            $env:CI = '1'
            try {
                & $releaseSmokeNpm run test:e2e
                if ($LASTEXITCODE -ne 0) {
                    Write-OperatorFailureTriage -Stage 'Playwright E2E (-RunPlaywright)' -Category 'PlaywrightFailure' `
                        -Details @("npm run test:e2e exited $LASTEXITCODE (see Playwright output above).") `
                        -NextSteps @(
                        'cd archlucid-ui; npx playwright install',
                        'archlucid-ui/docs/TESTING_AND_TROUBLESHOOTING.md — section 8',
                        'Ensure port 3000 free for test webServer'
                    )
                    exit $LASTEXITCODE
                }
            }
            finally {
                if ($null -eq $savedCi) { Remove-Item Env:\CI -ErrorAction SilentlyContinue }
                else { $env:CI = $savedCi }
            }
        }
        finally {
            Pop-Location
        }
    }

    function Invoke-LivePlaywrightBlock
    {
        Write-Host ''
        Write-Host '=== Playwright E2E live-api parity (-LivePlaywright or -Profile LiveUiSql mirrors CI ui-e2e-live) ===' -ForegroundColor Cyan

        $standaloneDir = Join-Path $uiRoot '.next/standalone'
        if (-not (Test-Path $standaloneDir)) {
            Write-Warning 'Live Playwright: .next/standalone not found. Playwright uses a cold production build via webServer (slow). Prefer a prior successful UI build without -SkipUi.'
        }

        Push-Location $uiRoot
        try {
            if ($UiSkipped -or -not (Test-Path (Join-Path $uiRoot 'node_modules')))
            {
                Write-Host 'Installing UI dependencies (npm ci) for Playwright...'
                & $releaseSmokeNpm ci
                if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
            }

            Ensure-ReleaseSmokePlaywrightChromiumBrowsersInstalled -UiRoot $uiRoot -NpmExe $releaseSmokeNpm -TriageStage 'Playwright E2E (-LivePlaywright) Chromium cache'

            $savedLiveUrl = $env:LIVE_API_URL
            $savedSkipBuild = $env:LIVE_E2E_SKIP_NEXT_BUILD
            $env:LIVE_API_URL = $ApiBaseUrl.TrimEnd('/')
            if (Test-Path $standaloneDir) {
                $env:LIVE_E2E_SKIP_NEXT_BUILD = '1'
            }
            else {
                Remove-Item Env:\LIVE_E2E_SKIP_NEXT_BUILD -ErrorAction SilentlyContinue
            }

            $env:CI = '1'
            try {
                & $releaseSmokeNpm exec playwright test
                if ($LASTEXITCODE -ne 0) {
                    Write-OperatorFailureTriage -Stage 'Playwright E2E (-LivePlaywright)' -Category 'PlaywrightFailure' `
                        -Details @(('live playwright exited {0} - same suite as CI ui-e2e-live (live-api-* + demo-workspace-*.smoke; includes @release-gate GA demo anchors).' -f $LASTEXITCODE)) `
                        -NextSteps @(
                        'cd archlucid-ui; npx playwright install',
                        'Ensure API still listening at LIVE_API_URL',
                        'docs/library/LIVE_E2E_HAPPY_PATH.md'
                    )
                    exit $LASTEXITCODE
                }
            }
            finally {
                if ($null -eq $savedCi) { Remove-Item Env:\CI -ErrorAction SilentlyContinue }
                else { $env:CI = $savedCi }

                if ($null -eq $savedLiveUrl) { Remove-Item Env:\LIVE_API_URL -ErrorAction SilentlyContinue }
                else { $env:LIVE_API_URL = $savedLiveUrl }

                if ($null -eq $savedSkipBuild) { Remove-Item Env:\LIVE_E2E_SKIP_NEXT_BUILD -ErrorAction SilentlyContinue }
                else { $env:LIVE_E2E_SKIP_NEXT_BUILD = $savedSkipBuild }
            }
        }
        finally {
            Pop-Location
        }
    }

    if ($RunPlaywright) {
        Invoke-MockPlaywrightBlock
    }

    if ($LivePlaywright -and -not $SkipE2E) {
        Invoke-LivePlaywrightBlock
    }
}

try
{
    $script:releaseSmokeUiVitestProductionBuildRan = $false
    $script:releaseSmokeProductionLikeConfigLintRan = $false
    $cs = Get-ResolvedReleaseSmokeSqlConnectionString -FromParam $SqlConnectionString

    Write-OperatorPhaseHeader -Title 'Release build' -Step 1 -Total 8
    & (Join-Path $PSScriptRoot 'build-release.ps1')
    if ($LASTEXITCODE -ne 0) {
        Write-OperatorFailureTriage -Stage '1/8 Release build' -Category 'BuildOrRestoreFailure' `
            -Details @('build-release.ps1 exited non-zero.') `
            -NextSteps @('Run: .\build-release.ps1', 'Then: dotnet build ArchLucid.sln -c Release')
        exit $LASTEXITCODE
    }

    Write-Host ''
    Write-Host '=== Demo workspace pins (manifest vs DEMO_WORKSPACES.md) ===' -ForegroundColor Cyan
    & (Join-Path $PSScriptRoot 'demo-workspaces/Validate-DemoWorkspacesDoc.ps1') -RepoRoot $root
    if ($LASTEXITCODE -ne 0) {
        Write-OperatorFailureTriage -Stage '1b Demo workspace doc parity' -Category 'DocumentationDrift' `
            -Details @('fixtures/demo-workspaces/demo-workspaces.fixture.manifest.json anchors must appear in docs/go-to-market/DEMO_WORKSPACES.md.') `
            -NextSteps @(
            'Run: ./scripts/demo-workspaces/Validate-DemoWorkspacesDoc.ps1',
            'See docs/go-to-market/DEMO_WORKSPACES.md — Pinned fixture package'
        )
        exit $LASTEXITCODE
    }

    Write-OperatorPhaseHeader -Title 'Production-like config lint (profile production-like-hosted-pilot)' -Step 2 -Total 8
    [string] $releaseSmokeEvidenceDir = Join-Path $root 'artifacts/release-readiness'
    & (Join-Path $PSScriptRoot 'ci/Invoke-ConfigLintProofStep.ps1') `
        -OutputDir $releaseSmokeEvidenceDir `
        -SkipBuild

    if ($LASTEXITCODE -ne 0) {
        Write-OperatorFailureTriage -Stage '2/8 Production-like config lint' -Category 'ConfigLintFailure' `
            -Details @(
            'Blocking production-like-hosted-pilot findings in fixtures/release-candidate/appsettings.json.',
            'Artifacts: artifacts/release-readiness/config-lint-production-like-hosted-pilot.json'
        ) `
            -NextSteps @(
            'Inspect config-lint-production-like-hosted-pilot.md for blocking rows',
            'Validate deployed config with the same profile before RC signoff',
            'See docs/library/CONFIGURATION_REFERENCE.md'
        )
        exit $LASTEXITCODE
    }

    [bool] $script:releaseSmokeProductionLikeConfigLintRan = $true

    Write-OperatorPhaseHeader -Title 'Fast core tests (Release)' -Step 3 -Total 8
    dotnet test $sln -c Release --no-build --filter "Suite=Core&Category!=Slow&Category!=Integration"
    if ($LASTEXITCODE -ne 0) {
        Write-OperatorFailureTriage -Stage '3/8 Fast core tests' -Category 'TestFailure' `
            -Details @('First failing test is listed above in the test log.') `
            -NextSteps @(
            'dotnet test ArchLucid.sln -c Release --no-build --filter "Suite=Core&Category!=Slow&Category!=Integration"',
            'See docs/TEST_STRUCTURE.md for Suite/Core vs Integration'
        )
        exit $LASTEXITCODE
    }

    if ($FullCore)
    {
        Write-Host ''
        Write-Host '=== [3b/8] Full Core suite (optional; may require SQL) ===' -ForegroundColor Cyan
        dotnet test $sln -c Release --no-build --filter "Suite=Core"
        if ($LASTEXITCODE -ne 0) {
            Write-OperatorFailureTriage -Stage '3b/8 Full Core suite' -Category 'TestFailure' `
                -Details @('-FullCore includes integration-style tests; failures often need SQL or local services.') `
                -NextSteps @(
                'Re-run without -FullCore to isolate E2E smoke, or fix SQL per docs/BUILD.md',
                'dotnet test ArchLucid.sln -c Release --no-build --filter "Suite=Core"'
            )
            exit $LASTEXITCODE
        }
    }

    if (-not $SkipUi)
    {
        $node = Get-Command node -ErrorAction SilentlyContinue
        if ($null -ne $node)
        {
            Write-OperatorPhaseHeader -Title 'Operator UI — Vitest' -Step 4 -Total 8
            $uiRoot = Join-Path $root 'archlucid-ui'
            Push-Location $uiRoot
            & $releaseSmokeNpm ci
            if ($LASTEXITCODE -ne 0) {
                Pop-Location
                Write-OperatorFailureTriage -Stage '4/8 UI Vitest' -Category 'NpmCiFailure' `
                    -Details @('npm ci failed in archlucid-ui.') `
                    -NextSteps @('cd archlucid-ui; npm ci', 'Or: .\scripts\release-smoke.ps1 -SkipUi')
                exit $LASTEXITCODE
            }
            & $releaseSmokeNpm run test
            if ($LASTEXITCODE -ne 0) {
                Pop-Location
                Write-OperatorFailureTriage -Stage '4/8 UI Vitest' -Category 'VitestFailure' `
                    -Details @('Vitest failed — file names above.') `
                    -NextSteps @('cd archlucid-ui; npm run test', 'Or: .\scripts\release-smoke.ps1 -SkipUi')
                exit $LASTEXITCODE
            }

            Write-OperatorPhaseHeader -Title 'Operator UI — production build' -Step 5 -Total 8
            & $releaseSmokeNpm run build
            Pop-Location
            if ($LASTEXITCODE -ne 0) {
                Write-OperatorFailureTriage -Stage '5/8 UI production build' -Category 'NextBuildFailure' `
                    -Details @('next build / npm run build failed.') `
                    -NextSteps @('cd archlucid-ui; npm run build', 'Or: .\scripts\release-smoke.ps1 -SkipUi')
                exit $LASTEXITCODE
            }

            $script:releaseSmokeUiVitestProductionBuildRan = $true
        }
        else
        {
            Write-Warning 'Node.js not on PATH; skipped UI Vitest and next build.'
        }
    }
    else
    {
        Write-Host ''
        Write-Host '=== [3-4/6] Skipped UI (-SkipUi) ===' -ForegroundColor DarkGray
    }

    $uiExplicitSkip = ([bool]$SkipUi.IsPresent)
    $requestedPlaywrightNotHonored = ((-not [string]::IsNullOrWhiteSpace($Profile)) -or [bool]$RunPlaywright.IsPresent -or [bool]$LivePlaywright.IsPresent)

    if ((-not $SkipE2E) -and $runLivePlaywrightEffective -and (-not $SkipUi))
    {
        $nodeForChromium = Get-Command node -ErrorAction SilentlyContinue

        if ($null -ne $nodeForChromium -and ($script:releaseSmokeUiVitestProductionBuildRan -or (Test-Path (Join-Path $root 'archlucid-ui/node_modules/@playwright')))) {
            $uiRootEnsure = Join-Path $root 'archlucid-ui'
            Ensure-ReleaseSmokePlaywrightChromiumBrowsersInstalled -UiRoot $uiRootEnsure -NpmExe $releaseSmokeNpm `
                -TriageStage '6/8 Precheck Chromium (blocks before smoke API start)'
        }
        elseif (($null -eq $nodeForChromium) -and $runLiveUiSqlProfile) {

            Write-OperatorFailureTriage -Stage '-Profile LiveUiSql (precheck — Node)' -Category 'Misconfiguration' `
                -Details @('Node vanished from PATH after UI prerequisites (unexpected for this profile).') `
                -NextSteps @('Re-open shell; ensure Node 22+ on PATH')
            exit 1
        }
    }

    if ($SkipE2E)
    {

        $liveReq = ([bool]$LivePlaywright.IsPresent -or $runLiveUiSqlProfile)

        if ($liveReq) {

            Write-Warning 'Live parity (-LivePlaywright or -Profile LiveUiSql) skipped under -SkipE2E (steps 5–7 never ran; API not started).'
        }

        if ($Profile -eq 'ReleaseCandidate') {
            Write-OperatorFailureTriage -Stage 'ReleaseCandidate (-SkipE2E blocked)' -Category 'StrictRcValidation' `
                -Details @(
                'Release candidate profile is fail-closed: -SkipE2E produces Partial evidence only and cannot satisfy RC signoff lanes.'
            ) `
                -NextSteps @(
                'Omit -SkipE2E and supply tenant SQL (ARCHLUCID_SMOKE_SQL or -SqlConnectionString)',
                'Use plain release-smoke.ps1 -SkipE2E for build-only developer workflows',
                'See docs/library/RELEASE_SMOKE.md — ReleaseCandidate profile'
            )
            exit 1
        }

        Write-Host '=== 6-8/8 Skipped E2E API+CLI (-SkipE2E) ==='
        if ($FullCore)
        {
            Write-Host 'Release smoke finished (build + fast core + full Core suite).'
        }
        else
        {
            Write-Host 'Release smoke finished (build + fast core tests).'
        }

        Write-ReleaseSmokeEvidenceSummary -ExitMode SkipE2EEarly `
            -LiveUiSqlProfile:$runLiveUiSqlProfile `
            -RanFastCoreGate:$true `
            -RanFullCore:([bool]$FullCore.IsPresent) `
            -RanUiVitestAndProductionBuild:$script:releaseSmokeUiVitestProductionBuildRan `
            -SkippedUiExplicitly:$uiExplicitSkip `
            -RanApiCliArtifacts:$false `
            -RanRunExportOutbox:$false `
            -RanProductionLikeConfigLint:$script:releaseSmokeProductionLikeConfigLintRan `
            -RanMockPlaywright:$false `
            -RanLivePlaywrightRequestedButSkipped:$requestedPlaywrightNotHonored `
            -RanLivePlaywright:$false `
            -ApiBaseUrlEvidence $ApiBaseUrl

        Write-ReleaseSmokeResultArtifact -Verdict Partial -ResultOutPath $ResultOut `
            -SkipE2E:$true `
            -FullCore:([bool]$FullCore.IsPresent) `
            -RanUiVitestAndProductionBuild:$script:releaseSmokeUiVitestProductionBuildRan `
            -SkippedUiExplicitly:$uiExplicitSkip `
            -RanApiCliArtifacts:$false `
            -RanRunExportOutbox:$false `
            -RanProductionLikeConfigLint:$script:releaseSmokeProductionLikeConfigLintRan `
            -RanMockPlaywright:$false `
            -RanLivePlaywright:$false `
            -ApiBaseUrlEvidence $ApiBaseUrl `
            -ProfileName $Profile

        exit 0
    }

    if ([string]::IsNullOrWhiteSpace($cs))
    {
        Write-OperatorFailureTriage -Stage '6/8 E2E API block (not started)' -Category 'Misconfiguration' `
            -Details @('No SQL connection string resolved for the temporary API process.') `
            -NextSteps @(
            'Set env: $env:ARCHLUCID_SMOKE_SQL = ''Server=...;Database=...;...''',
            'Or pass: -SqlConnectionString ''...''',
            'Or set ConnectionStrings__ArchLucid in the shell',
            'CI / agents without SQL: .\scripts\release-smoke.ps1 -SkipE2E'
        )
        exit 1
    }

    Write-OperatorPhaseHeader -Title 'Start API (Release), wait for /health/ready, Gate 1 HTTP create→commit' -Step 6 -Total 8
    $tempRoot = Join-Path ([System.IO.Path]::GetTempPath()) ("archlucid-smoke-" + (Get-Date -Format 'yyyyMMddHHmmss'))
    New-Item -ItemType Directory -Path $tempRoot -Force | Out-Null

    $env:ConnectionStrings__ArchLucid = $cs
    $env:ASPNETCORE_ENVIRONMENT = 'Development'
    $env:AgentExecution__Mode = 'Simulator'
    # Development appsettings default StorageProvider=InMemory; Gate 1 requires durable SQL.
    $env:ArchLucid__StorageProvider = 'Sql'
    $env:ArchLucidAuth__AllowTestActorHeaders = 'true'
    $env:DataConsistency__InitialDelaySeconds = '0'
    $env:HostLeaderElection__Enabled = 'false'
    $env:ArchLucid__ControllerReadPathWarmup__Enabled = 'false'
    $env:Demo__Enabled = 'false'
    $env:Demo__SeedOnStartup = 'false'

    if ([bool]$AuthorityPipelineDtfSmoke.IsPresent)
    {
        $env:ArchLucid__AuthorityPipeline__OrchestratorBackend = 'DurableTask'
    }

    # -WindowStyle is Windows-only; Linux/macOS pwsh rejects it (Cloud Agent Gate 1 path).
    $apiStdoutLog = Join-Path $tempRoot 'api-stdout.log'
    $apiStderrLog = Join-Path $tempRoot 'api-stderr.log'
    $apiStartArgs = @{
        FilePath               = 'dotnet'
        ArgumentList           = @(
            'run',
            '--project', $apiProj,
            '-c', 'Release',
            '--no-build',
            '--launch-profile', 'http'
        )
        WorkingDirectory       = $root
        PassThru               = $true
        RedirectStandardOutput = $apiStdoutLog
        RedirectStandardError  = $apiStderrLog
    }

    if ($IsWindows) {
        $apiStartArgs['WindowStyle'] = 'Hidden'
    }

    $apiProc = Start-Process @apiStartArgs

    if ($null -eq $apiProc)
    {
        Write-OperatorFailureTriage -Stage '6/8 Start API' -Category 'ProcessStartFailure' `
            -Details @('Start-Process did not return a handle for dotnet run ArchLucid.Api.') `
            -NextSteps @('Verify dotnet on PATH', 'Run manually: dotnet run --project ArchLucid.Api -c Release --launch-profile http')
        exit 1
    }

    $ready = $false
    $readyUrl = $ApiBaseUrl.TrimEnd('/') + '/health/ready'

    for ($i = 0; $i -lt 120; $i++) {
        if ($apiProc.HasExited) {
            Write-OperatorFailureTriage -Stage '6/8 API readiness' -Category 'ApiProcessExitedEarly' `
                -Details @(
                "The API process exited before /health/ready returned 200 (exit code hint: $($apiProc.ExitCode)).",
                'This script starts the API hidden — stdout/stderr are not shown here.'
            ) `
                -NextSteps @(
                'Verify SQL: migrations, firewall, TrustServerCertificate, correct database name',
                "Confirm nothing else is bound to $($ApiBaseUrl) (or pass -ApiBaseUrl)",
                'Reproduce in a visible window: $env:ConnectionStrings__ArchLucid = ''...''; dotnet run --project ArchLucid.Api -c Release --launch-profile http',
                'CLI: dotnet run --project ArchLucid.Cli -- doctor   (with API up)',
                'See docs/library/RELEASE_SMOKE.md — Troubleshooting'
            )
            exit 1
        }

        $probe = Get-ArchLucidHttpProbe -Uri $readyUrl -TimeoutSec 2 -Headers $releaseSmokeAuthHeaders

        if ($probe.Ok -and $probe.StatusCode -eq 200) {
            $ready = $true
            break
        }

        Start-Sleep -Seconds 1
    }

    if (-not $ready) {
        Write-OperatorFailureTriage -Stage '6/8 API readiness' -Category 'ReadinessTimeout' `
            -Details @(
            'GET /health/ready did not return HTTP 200 within 120s (first blocking gate for E2E).',
            "Target: $readyUrl"
        ) `
            -NextSteps @(
            'Inspect failing health checks below (first unhealthy entry is the usual root cause).',
            'dotnet run --project ArchLucid.Cli -- doctor',
            'docs/TROUBLESHOOTING.md — SQL, port 5128, ArchLucid:StorageProvider',
            'Pilot misconfig: wrong connection string or SQL unreachable from this machine'
        )
        Write-ArchLucidReadinessTimeoutDiagnostics -ApiBaseUrl $ApiBaseUrl -ProbeHeaders $releaseSmokeAuthHeaders
        exit 1
    }

    $liveUrl = $ApiBaseUrl.TrimEnd('/') + '/health/live'
    $liveProbe = Get-ArchLucidHttpProbe -Uri $liveUrl -TimeoutSec 8 -Headers $releaseSmokeAuthHeaders

    if (-not $liveProbe.Ok -or $liveProbe.StatusCode -ne 200) {
        Write-OperatorFailureTriage -Stage '6/8 Liveness after readiness' -Category 'LivenessFailure' `
            -Details @("GET $liveUrl returned HTTP $($liveProbe.StatusCode) (expected 200).") `
            -NextSteps @('If readiness passed but live failed, capture API logs and open an issue — unusual ordering.')
        exit 1
    }

    Push-Location $tempRoot
    try
    {
        dotnet run --project $cliProj -- new ArchLucidSmokeRc
        if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    }
    finally
    {
        Pop-Location
    }

    $projDir = Join-Path $tempRoot 'ArchLucidSmokeRc'
    if (-not (Test-Path $projDir)) {
        Write-OperatorFailureTriage -Stage '6/8 CLI new' -Category 'ScaffoldLayoutMissing' `
            -Details @("Expected project folder at $projDir after archlucid new.") `
            -NextSteps @('Re-run new in an empty folder', 'Check CLI new command output above')
        exit 1
    }

    $env:ARCHLUCID_API_URL = $ApiBaseUrl

    # Gate 1 witness: Guided workspace + create (≥100-char architecture brief). SQL StorageProvider
    # runs the authority pipeline inline to a committed golden manifest (CLI `run --quick` removed).
    $briefPath = Join-Path $projDir 'inputs/brief.md'
    if (-not (Test-Path $briefPath)) {
        Write-OperatorFailureTriage -Stage '6/8 Gate 1 create' -Category 'ScaffoldLayoutMissing' `
            -Details @("Expected brief at $briefPath after archlucid new.") `
            -NextSteps @('Re-run CLI new', 'Inspect scaffolded ArchLucidSmokeRc layout')
        exit 1
    }

    # Evidence floor is ≥100 chars; Architectures.DisplayName is nvarchar(200) and currently
    # mirrors description on identity link — keep the create description in that window.
    $briefContent = @(
        'Design an Azure App Service + SQL portal with private endpoints, managed identity,',
        'Key Vault, App Insights, Service Bus, and Blob Storage for internal document workflows.'
    ) -join ' '
    Set-Content -LiteralPath $briefPath -Value $briefContent -Encoding utf8

    $createBody = @{
        requestId            = [guid]::NewGuid().ToString('N')
        systemName           = ('ArchLucidSmokeRc-' + [guid]::NewGuid().ToString('N').Substring(0, 8))
        description          = $briefContent
        environment          = 'dev'
        cloudProvider        = 'Azure'
        constraints          = @('Private endpoints required', 'Use managed identity', 'release-smoke Gate 1')
        requiredCapabilities = @('web', 'sql', 'Managed Identity')
        assumptions          = @('Internal enterprise usage', 'Moderate query volume')
    } | ConvertTo-Json -Depth 6

    $createParams = @{
        Uri         = ($ApiBaseUrl.TrimEnd('/') + '/v1/architecture/request')
        Method      = 'Post'
        ContentType = 'application/json'
        Body        = $createBody
    }

    if ($releaseSmokeAuthHeaders.Count -gt 0) {
        $createParams.Headers = $releaseSmokeAuthHeaders
    }

    try {
        $createJson = Invoke-RestMethod @createParams
    }
    catch {
        Write-OperatorFailureTriage -Stage '6/8 Gate 1 create' -Category 'CreateRunFailure' `
            -Details @("POST /v1/architecture/request failed: $($_.Exception.Message)") `
            -NextSteps @(
                'Confirm ArchLucid__StorageProvider=Sql and SQL catalog exists',
                'API logs often include TB-310 / κ drift if header seals race finalize',
                'dotnet run --project ArchLucid.Cli -- doctor'
            )
        exit 1
    }

    $runId = [string]$createJson.run.runId
    if ([string]::IsNullOrWhiteSpace($runId)) {
        Write-OperatorFailureTriage -Stage '6/8 Gate 1 create' -Category 'CreateRunFailure' `
            -Details @('Create response missing run.runId.') `
            -NextSteps @('Inspect create JSON', 'Confirm API contract for POST /v1/architecture/request')
        exit 1
    }

    $outputsDir = Join-Path $projDir 'outputs'
    New-Item -ItemType Directory -Path $outputsDir -Force | Out-Null
    $summaryPath = Join-Path $outputsDir 'run-summary.json'
    $summaryObject = [ordered]@{
        runId       = $runId
        requestId   = [string]$createJson.run.requestId
        status      = [string]$createJson.run.status
        createdUtc  = [string]$createJson.run.createdUtc
        apiBaseUrl  = $ApiBaseUrl.TrimEnd('/')
        gate1Path   = 'http-create-commit'
    }
    ($summaryObject | ConvertTo-Json -Depth 6) | Set-Content -LiteralPath $summaryPath -Encoding utf8

    Write-OperatorPhaseHeader -Title "Verify manifest + synthesized artifacts (run $runId)" -Step 7 -Total 8

    $runGetParams = @{
        Uri    = ($ApiBaseUrl.TrimEnd('/') + '/v1/architecture/review/' + $runId)
        Method = 'Get'
    }

    if ($releaseSmokeAuthHeaders.Count -gt 0) {
        $runGetParams.Headers = $releaseSmokeAuthHeaders
    }

    try {
        $runJson = Invoke-RestMethod @runGetParams
    }
    catch {
        Write-OperatorFailureTriage -Stage '7/8 Artifact verification' -Category 'RunGetFailure' `
            -Details @("GET /v1/architecture/review/$runId failed: $($_.Exception.Message)") `
            -NextSteps @('Confirm create completed under Sql storage', 'Inspect API logs for this runId')
        exit 1
    }

    $runStatus = [string]$runJson.run.status
    $manifestId = [string]$runJson.run.goldenManifestId
    $artifactBundleId = [string]$runJson.run.artifactBundleId

    if ([string]::IsNullOrWhiteSpace($manifestId) -and $runStatus -eq 'ReadyForCommit') {
        $finalizeParams = @{
            Uri    = ($ApiBaseUrl.TrimEnd('/') + '/v1/architecture/review/' + $runId + '/finalize')
            Method = 'Post'
        }

        if ($releaseSmokeAuthHeaders.Count -gt 0) {
            $finalizeParams.Headers = $releaseSmokeAuthHeaders
        }

        try {
            Invoke-RestMethod @finalizeParams | Out-Null
            $runJson = Invoke-RestMethod @runGetParams
            $manifestId = [string]$runJson.run.goldenManifestId
            $runStatus = [string]$runJson.run.status
            $artifactBundleId = [string]$runJson.run.artifactBundleId
        }
        catch {
            Write-OperatorFailureTriage -Stage '7/8 Artifact verification' -Category 'FinalizeFailure' `
                -Details @("POST finalize for ReadyForCommit run $runId failed: $($_.Exception.Message)") `
                -NextSteps @('Inspect κ drift / sealed-hash / TB-310 errors in API logs')
            exit 1
        }
    }

    if ($runStatus -ne 'Committed' -or [string]::IsNullOrWhiteSpace($manifestId)) {
        Write-OperatorFailureTriage -Stage '7/8 Artifact verification' -Category 'MissingGoldenManifest' `
            -Details @("Run $runId status=$runStatus manifest=$manifestId — expected Committed with goldenManifestId.") `
            -NextSteps @(
            'Confirm Sql StorageProvider and authority pipeline completed',
            'Inspect API logs for this runId (TB-310 / MarkAuthorityPipelineCommitted)'
        )
        exit 1
    }

    if ([string]::IsNullOrWhiteSpace($artifactBundleId)) {
        Write-OperatorFailureTriage -Stage '7/8 Artifact verification' -Category 'NoSynthesizedArtifacts' `
            -Details @("Run $runId is Committed but artifactBundleId is empty.") `
            -NextSteps @('Authority artifacts stage may have failed — search API logs for this runId')
        exit 1
    }

    try {
        $summaryGetParams = @{
            Uri    = ($ApiBaseUrl.TrimEnd('/') + '/v1/authority/signed-review-records/' + $manifestId + '/summary')
            Method = 'Get'
        }

        if ($releaseSmokeAuthHeaders.Count -gt 0) {
            $summaryGetParams.Headers = $releaseSmokeAuthHeaders
        }

        $null = Invoke-RestMethod @summaryGetParams
    }
    catch {
        Write-OperatorFailureTriage -Stage '7/8 Artifact verification' -Category 'ArtifactsApiFailure' `
            -Details @("GET /v1/authority/signed-review-records/$manifestId/summary failed: $($_.Exception.Message)") `
            -NextSteps @('Confirm golden manifest row exists', 'Check run and manifest IDs in API logs')
        exit 1
    }

    # Career export honesty may 409 list/download without asserted intake; Gate 1 counts durable bundle rows.
    $bundleGuid = [guid]$artifactBundleId
    $artifactCountSql = @"
SELECT COUNT(1)
FROM dbo.ArtifactBundleArtifacts
WHERE BundleId = '$($bundleGuid.ToString('D'))';
"@

    try {
        $artifactCountRaw = Invoke-ReleaseSmokeSqlScalar -RepoRoot $root -ConnectionString $cs -Sql $artifactCountSql
        $artifactCount = [int]$artifactCountRaw
    }
    catch {
        Write-OperatorFailureTriage -Stage '7/8 Artifact verification' -Category 'MissingSqlDll' `
            -Details @("Failed to count ArtifactBundleArtifacts via tools/ArchLucid.SqlScalar: $($_.Exception.Message)") `
            -NextSteps @(
            'dotnet build tools/ArchLucid.SqlScalar/ArchLucid.SqlScalar.csproj -c Release',
            'Ensure ARCHLUCID_SMOKE_SQL reaches the same catalog the API used'
        )
        exit 1
    }

    if ($artifactCount -lt 1) {
        Write-OperatorFailureTriage -Stage '7/8 Artifact verification' -Category 'NoSynthesizedArtifacts' `
            -Details @("Bundle $artifactBundleId has $artifactCount ArtifactBundleArtifacts row(s); expected >= 1.") `
            -NextSteps @(
            'Synthesis or persistence regression — search API logs for this runId/bundleId',
            'docs/library/RELEASE_SMOKE.md — Zero artifacts'
        )
        exit 1
    }

    Write-Host "Smoke OK: status=Committed manifest=$manifestId bundle=$artifactBundleId artifactRows=$artifactCount." -ForegroundColor Green

    Write-OperatorPhaseHeader -Title "Verify durable run-export outbox (run $runId)" -Step 8 -Total 8

    $pushParams = @{
        Uri         = ($ApiBaseUrl.TrimEnd('/') + '/v1/artifacts/runs/' + $runId + '/export/push')
        Method      = 'Post'
        Body        = (@{ destinationSasUrl = "https://127.0.0.1/fake?sas=token" } | ConvertTo-Json)
        ContentType = 'application/json'
    }

    if ($releaseSmokeAuthHeaders.Count -gt 0) {
        $pushParams.Headers = $releaseSmokeAuthHeaders
    }

    try {
        $pushResponse = Invoke-RestMethod @pushParams
        Write-Host 'Smoke OK: Enqueued run-export blob push via API.' -ForegroundColor Green
    }
    catch {
        Write-OperatorFailureTriage -Stage '8/8 Outbox verification' -Category 'ExportPushApiFailure' `
            -Details @("POST /v1/artifacts/runs/$runId/export/push failed: $($_.Exception.Message)") `
            -NextSteps @('Check API logs', 'Verify run ID and SAS validation')
        exit 1
    }

    Write-Host 'Polling dbo.RunExportBlobPushOutbox for dead-letter outcome...'
    $runGuidForOutbox = [guid]$runId
    $outboxDeadLetterSql = @"
SELECT TOP 1
  CONCAT(
    CONVERT(varchar(33), DeadLetteredUtc, 126),
    '|',
    CONVERT(varchar(11), AttemptCount),
    '|',
    ISNULL(LastAttemptError, ''))
FROM dbo.RunExportBlobPushOutbox
WHERE RunId = '$($runGuidForOutbox.ToString('D'))'
ORDER BY CreatedUtc DESC;
"@
    $foundDeadLetter = $false

    try {
        for ($i = 0; $i -lt 15; $i++) {
            $outboxRaw = Invoke-ReleaseSmokeSqlScalar -RepoRoot $root -ConnectionString $cs -Sql $outboxDeadLetterSql

            if (-not [string]::IsNullOrWhiteSpace($outboxRaw) -and -not $outboxRaw.StartsWith('|')) {
                $parts = $outboxRaw.Split('|', 3)
                $attempts = if ($parts.Length -gt 1) { $parts[1] } else { '?' }
                $lastErr = if ($parts.Length -gt 2) { $parts[2] } else { '' }
                $foundDeadLetter = $true
                Write-Host "Smoke OK: Export push dead-lettered as expected. (Attempts: $attempts, Error: $lastErr)" -ForegroundColor Green
                break
            }

            Start-Sleep -Seconds 1
        }
    }
    catch {
        Write-OperatorFailureTriage -Stage '8/8 Outbox verification' -Category 'MissingSqlDll' `
            -Details @("Failed to poll RunExportBlobPushOutbox via tools/ArchLucid.SqlScalar: $($_.Exception.Message)") `
            -NextSteps @(
            'dotnet build tools/ArchLucid.SqlScalar/ArchLucid.SqlScalar.csproj -c Release',
            'Ensure ARCHLUCID_SMOKE_SQL reaches the same catalog the API used'
        )
        exit 1
    }

    if (-not $foundDeadLetter) {
        Write-OperatorFailureTriage -Stage '8/8 Outbox verification' -Category 'OutboxProcessingTimeout' `
            -Details @("Outbox row for Run $runId did not reach DeadLetteredUtc within 15 seconds.") `
            -NextSteps @('Check if worker loop is healthy', 'Verify HostedService logs')
        exit 1
    }

    Invoke-ReleaseSmokePlaywrightWhenRequested -RepoRoot $root -RunPlaywright:$RunPlaywright -LivePlaywright:$runLivePlaywrightEffective -ApiBaseUrl $ApiBaseUrl -UiSkipped:$SkipUi -SkipE2E:$SkipE2E

    $shipGateEvidenceRan = $false
    if (-not [string]::IsNullOrWhiteSpace($ResultOut)) {
        $shipGateEvidenceRan = Invoke-ReleaseSmokeShipGateEvidence `
            -RunId $runId `
            -ApiBaseUrl $ApiBaseUrl `
            -RepoRoot $root `
            -CliProj $cliProj
    }

    Write-ReleaseSmokeEvidenceSummary -ExitMode Complete `
        -LiveUiSqlProfile:$runLiveUiSqlProfile `
        -RanFastCoreGate:$true `
        -RanFullCore:([bool]$FullCore.IsPresent) `
        -RanUiVitestAndProductionBuild:$script:releaseSmokeUiVitestProductionBuildRan `
        -SkippedUiExplicitly:$uiExplicitSkip `
        -RanApiCliArtifacts:$true `
        -RanRunExportOutbox:$true `
        -RanProductionLikeConfigLint:$script:releaseSmokeProductionLikeConfigLintRan `
        -RanMockPlaywright:([bool]$RunPlaywright.IsPresent) `
        -RanLivePlaywrightRequestedButSkipped:$false `
        -RanLivePlaywright:$runLivePlaywrightEffective `
        -ApiBaseUrlEvidence $ApiBaseUrl

    Write-ReleaseSmokeResultArtifact -Verdict Pass -ResultOutPath $ResultOut `
        -SkipE2E:$false `
        -FullCore:([bool]$FullCore.IsPresent) `
        -RanUiVitestAndProductionBuild:$script:releaseSmokeUiVitestProductionBuildRan `
        -SkippedUiExplicitly:$uiExplicitSkip `
        -RanApiCliArtifacts:$true `
        -RanRunExportOutbox:$true `
        -RanProductionLikeConfigLint:$script:releaseSmokeProductionLikeConfigLintRan `
        -RanMockPlaywright:([bool]$RunPlaywright.IsPresent) `
        -RanLivePlaywright:$runLivePlaywrightEffective `
        -ApiBaseUrlEvidence $ApiBaseUrl `
        -ProfileName $Profile `
        -RanShipGateEvidence:$shipGateEvidenceRan

    if ($Profile -eq 'ReleaseCandidate') {
        Publish-ReleaseSmokeRcCanonicalArtifacts -ResultOutPath $ResultOut -ExpectedProfile 'ReleaseCandidate'
    }

    Write-Host ''
    Write-Host 'Release smoke finished successfully.'
    exit 0
}
finally
{
    if ($null -ne $apiProc -and -not $apiProc.HasExited)
    {
        Stop-Process -Id $apiProc.Id -Force -ErrorAction SilentlyContinue
    }

    Restore-Env

    if ($null -ne $tempRoot -and (Test-Path $tempRoot))
    {
        Remove-Item $tempRoot -Recurse -Force -ErrorAction SilentlyContinue
    }
}
