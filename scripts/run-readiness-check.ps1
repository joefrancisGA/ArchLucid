# Pilot / RC gate: Release build, production-like config lint, fast-core tests in Release, optional UI Vitest. See docs/RELEASE_LOCAL.md
param(
    [switch] $SkipUi,
    [switch] $SkipConfigLint
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

. (Join-Path $PSScriptRoot 'OperatorDiagnostics.ps1')

$nodeAvailable = $null -ne (Get-Command node -ErrorAction SilentlyContinue)
$totalCorePhases = 3

if ((-not $SkipUi) -and $nodeAvailable) {
    $totalPhases = 4
}

else {
    $totalPhases = $totalCorePhases
}

Write-OperatorPhaseHeader -Title 'Release build (ArchLucid.sln, -c Release)' -Step 1 -Total $totalPhases
& (Join-Path $PSScriptRoot 'build-release.ps1')

if ($LASTEXITCODE -ne 0) {
    Write-OperatorFailureTriage -Stage '1 Release build' -Category 'BuildOrRestoreFailure' `
        -Details @('dotnet build or restore exited non-zero (see compiler output above).') `
        -NextSteps @(
        'Fix compile errors, then re-run: .\scripts\build-release.ps1',
        'Full log: dotnet build ArchLucid.sln -c Release --nologo'
    )
    exit $LASTEXITCODE
}

if (-not $SkipConfigLint) {
    Write-OperatorPhaseHeader -Title 'Production-like config lint (profile production-like-hosted-pilot; RC baseline fixture)' -Step 2 -Total $totalPhases
    [string] $readinessEvidenceDir = Join-Path $root 'artifacts/release-readiness'
    & (Join-Path $PSScriptRoot 'ci/Invoke-ConfigLintProofStep.ps1') `
        -OutputDir $readinessEvidenceDir `
        -SkipBuild

    if ($LASTEXITCODE -ne 0) {
        Write-OperatorFailureTriage -Stage '2 Production-like config lint' -Category 'ConfigLintFailure' `
            -Details @(
            'Blocking production-like-hosted-pilot findings in fixtures/release-candidate/appsettings.json (RC baseline shape).',
            'Artifacts: artifacts/release-readiness/config-lint-production-like-hosted-pilot.json'
        ) `
            -NextSteps @(
            'Inspect blocking rows in config-lint-production-like-hosted-pilot.md',
            'Validate deployed config: archlucid config lint --profile production-like-hosted-pilot --json-out <path>',
            'See docs/library/CONFIGURATION_REFERENCE.md — Production-like enterprise pilot',
            'Emergency local skip only: .\scripts\run-readiness-check.ps1 -SkipConfigLint'
        )
        exit $LASTEXITCODE
    }
}
else {
    Write-Warning 'Skipped production-like config lint (-SkipConfigLint). Do not use for release-candidate signoff.'
}

Write-OperatorPhaseHeader -Title 'Fast core tests (Release, no rebuild)' -Step 3 -Total $totalPhases
dotnet test ArchLucid.sln -c Release --no-build --filter "Suite=Core&Category!=Slow&Category!=Integration"

if ($LASTEXITCODE -ne 0) {
    Write-OperatorFailureTriage -Stage '3 Fast core tests' -Category 'TestFailure' `
        -Details @(
        'The first failing test name appears above in xUnit output (scroll up).',
        'Exit code is non-zero from dotnet test.'
    ) `
        -NextSteps @(
        'Re-run the same filter locally: dotnet test ArchLucid.sln -c Release --no-build --filter "Suite=Core&Category!=Slow&Category!=Integration"',
        'Narrow further: dotnet test <TestProject>.csproj -c Release --filter "FullyQualifiedName~PartialName"',
        'If failures mention SQL: some Core tests may need a server; compare with CI matrix in docs/TEST_STRUCTURE.md'
    )
    exit $LASTEXITCODE
}

if (-not $SkipUi) {
    $node = Get-Command node -ErrorAction SilentlyContinue

    if ($null -ne $node) {
        Write-OperatorPhaseHeader -Title 'Operator UI unit tests (Vitest)' -Step 4 -Total $totalPhases
        $uiRoot = Join-Path $root 'archlucid-ui'
        Set-Location $uiRoot
        npm ci

        if ($LASTEXITCODE -ne 0) {
            Set-Location $root
            Write-OperatorFailureTriage -Stage '4 UI unit tests' -Category 'NpmCiFailure' `
                -Details @('npm ci failed in archlucid-ui (lockfile / registry / network).') `
                -NextSteps @(
                'cd archlucid-ui; npm ci',
                'Confirm Node 22+ and a clean node_modules if needed',
                'To skip UI gate: .\scripts\run-readiness-check.ps1 -SkipUi'
            )
            exit $LASTEXITCODE
        }

        npm run test
        Set-Location $root

        if ($LASTEXITCODE -ne 0) {
            Write-OperatorFailureTriage -Stage '4 UI unit tests' -Category 'VitestFailure' `
                -Details @('Vitest reported failures (see file names above).') `
                -NextSteps @(
                'cd archlucid-ui; npm run test',
                'Run a single file: npx vitest run path/to/file.test.ts',
                'To skip UI gate: .\scripts\run-readiness-check.ps1 -SkipUi'
            )
            exit $LASTEXITCODE
        }
    }
    else {
        Write-Warning 'Node.js not on PATH; skipped UI unit tests. Use -SkipUi for a quiet skip, or install Node 22+.'
    }
}

Write-Host ''
Write-Host '=== Readiness check finished successfully ===' -ForegroundColor Green
exit 0
