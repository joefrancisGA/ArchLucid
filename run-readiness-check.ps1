# Pilot / RC gate: Release build, CLI auth lint (`dotnet run … -- config lint`), fast-core tests in Release, optional UI Vitest. See docs/RELEASE_LOCAL.md
param(
    [switch] $SkipUi
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

. (Join-Path (Join-Path $root 'scripts') 'OperatorDiagnostics.ps1')

$nodeAvailable = $null -ne (Get-Command node -ErrorAction SilentlyContinue)
$totalCorePhases = 3

if ((-not $SkipUi) -and $nodeAvailable) {
    $totalPhases = 4
}

else {
    $totalPhases = $totalCorePhases
}

Write-OperatorPhaseHeader -Title 'Release build (ArchLucid.sln, -c Release)' -Step 1 -Total $totalPhases
& (Join-Path $root 'build-release.ps1')

if ($LASTEXITCODE -ne 0) {
    Write-OperatorFailureTriage -Stage '1 Release build' -Category 'BuildOrRestoreFailure' `
        -Details @('dotnet build or restore exited non-zero (see compiler output above).') `
        -NextSteps @(
        'Fix compile errors, then re-run: .\build-release.ps1',
        'Full log: dotnet build ArchLucid.sln -c Release --nologo'
    )
    exit $LASTEXITCODE
}

Write-OperatorPhaseHeader -Title 'CLI config lint (auth traps only; ASPNETCORE_ENVIRONMENT=Development for empty cwd)' -Step 2 -Total $totalPhases
Push-Location $root
try {
    $savedAsp = [Environment]::GetEnvironmentVariable('ASPNETCORE_ENVIRONMENT', 'Process')
    [Environment]::SetEnvironmentVariable('ASPNETCORE_ENVIRONMENT', 'Development', 'Process')
    dotnet run --project (Join-Path $root 'ArchLucid.Cli\ArchLucid.Cli.csproj') -c Release --no-build -- config lint

    if ($LASTEXITCODE -ne 0) {
        Write-OperatorFailureTriage -Stage '2 CLI config lint' -Category 'ConfigLintFailure' `
            -Details @('Blocking auth mis-configuration found in cwd JSON overlays (appsettings/archlucid.json) combined with simulated env.') `
            -NextSteps @(
            'Inspect stderr above — fix AuthMode traps (see docs/library/CONFIGURATION_REFERENCE.md)',
            'Re-run manually: dotnet run --project ArchLucid.Cli/ArchLucid.Cli.csproj -c Release -- config lint'
        )
        exit $LASTEXITCODE
    }
}
finally {
    [Environment]::SetEnvironmentVariable('ASPNETCORE_ENVIRONMENT', $savedAsp, 'Process')
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
                'To skip UI gate: .\run-readiness-check.ps1 -SkipUi'
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
                'To skip UI gate: .\run-readiness-check.ps1 -SkipUi'
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
