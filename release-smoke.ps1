# End-to-end release smoke: Release build, core tests, optional UI, API+CLI+artifacts; optional -RunPlaywright (mock) and -LivePlaywright (live-api parity vs CI ui-e2e-live).
# Named profile LiveUiSql: same gates + enforced live playwright (browser UI vs smoke SQL API). SQL required unless -SkipE2E.
# Optional -AuthorityPipelineDtfSmoke: sets ArchLucid__AuthorityPipeline__OrchestratorBackend=DurableTask for the temporary API (requires ArchLucid__AuthorityPipeline__DurableTask__GrpcEndpoint in the environment — staging SQL + DTF worker validation).
# Full detail: docs/library/RELEASE_SMOKE.md
param(
    [ValidateSet('', 'LiveUiSql')]
    [string] $Profile = '',
    [string] $SqlConnectionString = '',
    [Alias('BaseUrl')]
    [string] $ApiBaseUrl = 'http://localhost:5128',
    [switch] $SkipE2E,
    [switch] $SkipUi,
    [switch] $FullCore,
    [switch] $RunPlaywright,
    [switch] $LivePlaywright,
    [switch] $AuthorityPipelineDtfSmoke
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
. (Join-Path (Join-Path $root 'scripts') 'OperatorDiagnostics.ps1')

$runLiveUiSqlProfile = ($Profile -eq 'LiveUiSql')

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
            -NextSteps @('Install Node.js 22+ on PATH', 'Then re-run .\release-smoke.ps1 -Profile LiveUiSql')
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
$apiProc = $null
$tempRoot = $null

function Restore-Env
{
    if ($null -eq $savedConn) { Remove-Item Env:\ConnectionStrings__ArchLucid -ErrorAction SilentlyContinue }
    else { $env:ConnectionStrings__ArchLucid = $savedConn }

    if ($null -eq $savedApiUrl) { Remove-Item Env:\ARCHLUCID_API_URL -ErrorAction SilentlyContinue }
    else { $env:ARCHLUCID_API_URL = $savedApiUrl }
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

function Write-ReleaseSmokeEvidenceSummary {
    param(
        [Parameter(Mandatory = $true)][ValidateSet('SkipE2EEarly', 'Complete')][string] $ExitMode,
        [bool] $LiveUiSqlProfile,
        [bool] $RanFastCoreGate,
        [bool] $RanFullCore,
        [bool] $RanUiVitestAndProductionBuild,
        [bool] $SkippedUiExplicitly,
        [bool] $RanApiCliArtifacts,
        [bool] $RanMockPlaywright,
        [bool] $RanLivePlaywrightRequestedButSkipped,
        [bool] $RanLivePlaywright,
        [string] $ApiBaseUrlEvidence
    )

    Write-Host ''
    Write-Host '=== Release smoke evidence summary (what ran vs not) ===' -ForegroundColor Cyan

    Write-Host ''
    Write-Host 'Validated this run:'
    Write-Host '  - Release solution build gate (step 1/6)'

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
        Write-Host ('  - Temporary ArchLucid.Api (Release, http profile) backed by tenant SQL resolved from ARCHLUCID_SMOKE_SQL / -SqlConnectionString / ConnectionStrings__ArchLucid (no secrets echoed here)')
        Write-Host ('  - GET /health/ready + /health/live; CLI new + run --quick against ' + $ApiBaseUrlEvidence)
        Write-Host '  - Manifest + synthesized artifacts via HTTP (at least one descriptor)'
    }

    Write-Host ''

    Write-Host 'Not asserted / not run this invocation:'
    if (-not $RanApiCliArtifacts) {
        Write-Host '  - SQL-backed smoke API + CLI artifact gate - omit -SkipE2E and supply tenant SQL'
    }

    if ($ExitMode -eq 'SkipE2EEarly') {
        Write-Host '  - Playwright lanes (stopped before steps 5-7 because -SkipE2E)'

        if ($RanLivePlaywrightRequestedButSkipped) {
            Write-Host '  - Note: playwright-related switches have no effect with -SkipE2E'
        }
    }

    Write-Host ''

    if ($ExitMode -eq 'SkipE2EEarly') {
        Write-Host 'How this maps to documented lanes:'
        Write-Host '  - CI-style mock UI E2E - archlucid-ui npm run test:e2e (playwright.mock.config.ts)'
        Write-Host '  - Named UI-SQL parity - release-smoke-live-ui-sql.cmd wraps -Profile LiveUiSql'
        Write-Host '  - Ad hoc parity switch - add -LivePlaywright (same SQL prerequisites as steps 5-7)'
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

    Write-Host ('  - Live UI-SQL claim - ' + $paritySwitchVerb + ' against the same smoke-started API as steps 5-7')

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
    $cs = Get-ResolvedReleaseSmokeSqlConnectionString -FromParam $SqlConnectionString

    Write-OperatorPhaseHeader -Title 'Release build' -Step 1 -Total 6
    & (Join-Path $root 'build-release.ps1')
    if ($LASTEXITCODE -ne 0) {
        Write-OperatorFailureTriage -Stage '1/6 Release build' -Category 'BuildOrRestoreFailure' `
            -Details @('build-release.ps1 exited non-zero.') `
            -NextSteps @('Run: .\build-release.ps1', 'Then: dotnet build ArchLucid.sln -c Release')
        exit $LASTEXITCODE
    }

    Write-OperatorPhaseHeader -Title 'Fast core tests (Release)' -Step 2 -Total 6
    dotnet test $sln -c Release --no-build --filter "Suite=Core&Category!=Slow&Category!=Integration"
    if ($LASTEXITCODE -ne 0) {
        Write-OperatorFailureTriage -Stage '2/6 Fast core tests' -Category 'TestFailure' `
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
        Write-Host '=== [2b/6] Full Core suite (optional; may require SQL) ===' -ForegroundColor Cyan
        dotnet test $sln -c Release --no-build --filter "Suite=Core"
        if ($LASTEXITCODE -ne 0) {
            Write-OperatorFailureTriage -Stage '2b/6 Full Core suite' -Category 'TestFailure' `
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
            Write-OperatorPhaseHeader -Title 'Operator UI — Vitest' -Step 3 -Total 6
            $uiRoot = Join-Path $root 'archlucid-ui'
            Push-Location $uiRoot
            & $releaseSmokeNpm ci
            if ($LASTEXITCODE -ne 0) {
                Pop-Location
                Write-OperatorFailureTriage -Stage '3/6 UI Vitest' -Category 'NpmCiFailure' `
                    -Details @('npm ci failed in archlucid-ui.') `
                    -NextSteps @('cd archlucid-ui; npm ci', 'Or: .\release-smoke.ps1 -SkipUi')
                exit $LASTEXITCODE
            }
            & $releaseSmokeNpm run test
            if ($LASTEXITCODE -ne 0) {
                Pop-Location
                Write-OperatorFailureTriage -Stage '3/6 UI Vitest' -Category 'VitestFailure' `
                    -Details @('Vitest failed — file names above.') `
                    -NextSteps @('cd archlucid-ui; npm run test', 'Or: .\release-smoke.ps1 -SkipUi')
                exit $LASTEXITCODE
            }

            Write-OperatorPhaseHeader -Title 'Operator UI — production build' -Step 4 -Total 6
            & $releaseSmokeNpm run build
            Pop-Location
            if ($LASTEXITCODE -ne 0) {
                Write-OperatorFailureTriage -Stage '4/6 UI production build' -Category 'NextBuildFailure' `
                    -Details @('next build / npm run build failed.') `
                    -NextSteps @('cd archlucid-ui; npm run build', 'Or: .\release-smoke.ps1 -SkipUi')
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
                -TriageStage '5/6 Precheck Chromium (blocks before smoke API start)'
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

        Write-Host '=== 5-6/6 Skipped E2E API+CLI (-SkipE2E) ==='
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
            -RanMockPlaywright:$false `
            -RanLivePlaywrightRequestedButSkipped:$requestedPlaywrightNotHonored `
            -RanLivePlaywright:$false `
            -ApiBaseUrlEvidence $ApiBaseUrl

        exit 0
    }

    if ([string]::IsNullOrWhiteSpace($cs))
    {
        Write-OperatorFailureTriage -Stage '5/6 E2E API block (not started)' -Category 'Misconfiguration' `
            -Details @('No SQL connection string resolved for the temporary API process.') `
            -NextSteps @(
            'Set env: $env:ARCHLUCID_SMOKE_SQL = ''Server=...;Database=...;...''',
            'Or pass: -SqlConnectionString ''...''',
            'Or set ConnectionStrings__ArchLucid in the shell',
            'CI / agents without SQL: .\release-smoke.ps1 -SkipE2E'
        )
        exit 1
    }

    Write-OperatorPhaseHeader -Title 'Start API (Release), wait for /health/ready, CLI quick run' -Step 5 -Total 6
    $tempRoot = Join-Path ([System.IO.Path]::GetTempPath()) ("archlucid-smoke-" + (Get-Date -Format 'yyyyMMddHHmmss'))
    New-Item -ItemType Directory -Path $tempRoot -Force | Out-Null

    $env:ConnectionStrings__ArchLucid = $cs
    $env:ASPNETCORE_ENVIRONMENT = 'Development'
    $env:AgentExecution__Mode = 'Simulator'

    if ([bool]$AuthorityPipelineDtfSmoke.IsPresent)
    {
        $env:ArchLucid__AuthorityPipeline__OrchestratorBackend = 'DurableTask'
    }

    $apiProc = Start-Process -FilePath 'dotnet' -ArgumentList @(
        'run',
        '--project', $apiProj,
        '-c', 'Release',
        '--no-build',
        '--launch-profile', 'http'
    ) -WorkingDirectory $root -PassThru -WindowStyle Hidden

    if ($null -eq $apiProc)
    {
        Write-OperatorFailureTriage -Stage '5/6 Start API' -Category 'ProcessStartFailure' `
            -Details @('Start-Process did not return a handle for dotnet run ArchLucid.Api.') `
            -NextSteps @('Verify dotnet on PATH', 'Run manually: dotnet run --project ArchLucid.Api -c Release --launch-profile http')
        exit 1
    }

    $ready = $false
    $readyUrl = $ApiBaseUrl.TrimEnd('/') + '/health/ready'

    for ($i = 0; $i -lt 120; $i++) {
        if ($apiProc.HasExited) {
            Write-OperatorFailureTriage -Stage '5/6 API readiness' -Category 'ApiProcessExitedEarly' `
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

        $probe = Get-ArchLucidHttpProbe -Uri $readyUrl -TimeoutSec 2

        if ($probe.Ok -and $probe.StatusCode -eq 200) {
            $ready = $true
            break
        }

        Start-Sleep -Seconds 1
    }

    if (-not $ready) {
        Write-OperatorFailureTriage -Stage '5/6 API readiness' -Category 'ReadinessTimeout' `
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
        Write-ArchLucidReadinessTimeoutDiagnostics -ApiBaseUrl $ApiBaseUrl
        exit 1
    }

    $liveUrl = $ApiBaseUrl.TrimEnd('/') + '/health/live'
    $liveProbe = Get-ArchLucidHttpProbe -Uri $liveUrl -TimeoutSec 8

    if (-not $liveProbe.Ok -or $liveProbe.StatusCode -ne 200) {
        Write-OperatorFailureTriage -Stage '5/6 Liveness after readiness' -Category 'LivenessFailure' `
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
        Write-OperatorFailureTriage -Stage '5/6 CLI new' -Category 'ScaffoldLayoutMissing' `
            -Details @("Expected project folder at $projDir after archlucid new.") `
            -NextSteps @('Re-run new in an empty folder', 'Check CLI new command output above')
        exit 1
    }

    $env:ARCHLUCID_API_URL = $ApiBaseUrl
    Push-Location $projDir
    try
    {
        dotnet run --project $cliProj -- run --quick
        if ($LASTEXITCODE -ne 0) {
            Write-OperatorFailureTriage -Stage '5/6 CLI run --quick' -Category 'CliRunFailure' `
                -Details @('run --quick failed — stderr above often includes HTTP status and Next: hints.') `
                -NextSteps @(
                'Confirm API still up and ARCHLUCID_API_URL matches smoke API',
                'API must see Development environment for seed (script sets ASPNETCORE_ENVIRONMENT=Development for child API)',
                'dotnet run --project ArchLucid.Cli -- doctor'
            )
            exit $LASTEXITCODE
        }
    }
    finally
    {
        Pop-Location
    }

    $summaryPath = Join-Path (Join-Path $projDir 'outputs') 'run-summary.json'
    if (-not (Test-Path $summaryPath)) {
        Write-OperatorFailureTriage -Stage '6/6 Artifact verification' -Category 'MissingRunSummary' `
            -Details @("Expected outputs\run-summary.json at $summaryPath") `
            -NextSteps @('Re-run run --quick with API logging visible', 'Check CLI Next: hints from step 5')
        exit 1
    }

    $summary = Get-Content $summaryPath -Raw | ConvertFrom-Json
    $runId = $summary.runId
    if ([string]::IsNullOrWhiteSpace($runId)) {
        Write-OperatorFailureTriage -Stage '6/6 Artifact verification' -Category 'InvalidRunSummary' `
            -Details @('run-summary.json exists but runId is empty.') `
            -NextSteps @('Inspect run-summary.json', 'Re-run CLI run --quick')
        exit 1
    }

    Write-OperatorPhaseHeader -Title "Verify manifest + synthesized artifacts (run $runId)" -Step 6 -Total 6
    $runJson = Invoke-RestMethod -Uri ($ApiBaseUrl.TrimEnd('/') + '/v1/architecture/run/' + $runId) -Method Get
    $manifestId = $runJson.run.goldenManifestId
    if ([string]::IsNullOrWhiteSpace($manifestId)) {
        Write-OperatorFailureTriage -Stage '6/6 Artifact verification' -Category 'MissingGoldenManifest' `
            -Details @("Run $runId has no goldenManifestId in GET /v1/architecture/run/{runId}.") `
            -NextSteps @(
            'Check API logs for commit/persistence errors for this runId',
            'Verify SQL persistence and Development seed path'
        )
        exit 1
    }

    try {
        $artifacts = Invoke-RestMethod -Uri ($ApiBaseUrl.TrimEnd('/') + '/v1/artifacts/manifests/' + $manifestId) -Method Get
    }
    catch {
        Write-OperatorFailureTriage -Stage '6/6 Artifact verification' -Category 'ArtifactsApiFailure' `
            -Details @("GET /v1/artifacts/manifests/$manifestId failed: $($_.Exception.Message)") `
            -NextSteps @('curl or browser the same URL with API up', 'Check run and manifest IDs in API logs')
        exit 1
    }

    $artifactCount = @($artifacts).Count
    if ($artifactCount -lt 1) {
        Write-OperatorFailureTriage -Stage '6/6 Artifact verification' -Category 'NoSynthesizedArtifacts' `
            -Details @("Manifest $manifestId returned $artifactCount artifact(s); expected >= 1.") `
            -NextSteps @(
            'Synthesis or persistence regression — search API logs for this manifestId',
            'docs/library/RELEASE_SMOKE.md — Zero artifacts'
        )
        exit 1
    }

    Write-Host "Smoke OK: $artifactCount artifact(s) listed for manifest $manifestId." -ForegroundColor Green
    Invoke-ReleaseSmokePlaywrightWhenRequested -RepoRoot $root -RunPlaywright:$RunPlaywright -LivePlaywright:$runLivePlaywrightEffective -ApiBaseUrl $ApiBaseUrl -UiSkipped:$SkipUi -SkipE2E:$SkipE2E

    Write-ReleaseSmokeEvidenceSummary -ExitMode Complete `
        -LiveUiSqlProfile:$runLiveUiSqlProfile `
        -RanFastCoreGate:$true `
        -RanFullCore:([bool]$FullCore.IsPresent) `
        -RanUiVitestAndProductionBuild:$script:releaseSmokeUiVitestProductionBuildRan `
        -SkippedUiExplicitly:$uiExplicitSkip `
        -RanApiCliArtifacts:$true `
        -RanMockPlaywright:([bool]$RunPlaywright.IsPresent) `
        -RanLivePlaywrightRequestedButSkipped:$false `
        -RanLivePlaywright:$runLivePlaywrightEffective `
        -ApiBaseUrlEvidence $ApiBaseUrl

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
