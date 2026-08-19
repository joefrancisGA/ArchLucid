# Runs one CI shard of ArchLucid.Api.Tests Integration tests (Category=Integration, Category!=Slow).
param(
    [Parameter(Mandatory)]
    [int]$ShardIndex,

    [int]$ShardCount = 4,

    [string]$ProjectPath = 'ArchLucid.Api.Tests/ArchLucid.Api.Tests.csproj',

    [string]$Configuration = 'Release',

    [Parameter(Mandatory)]
    [string]$ResultsDirectory,

    [string]$BaseFilter = 'Category!=Slow&Category=Integration',

    [string]$RunSettingsPath = 'test.runsettings',

    [int]$FilterChunkSize = 8,

    [string]$BlameHangTimeout = '75min',

    [string]$ChunkTimeout = '20min'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

. (Join-Path $PSScriptRoot 'ApiIntegrationTestShardSupport.ps1')
. (Join-Path $PSScriptRoot 'CiSqlServerDiagnostics.ps1')
. (Join-Path $PSScriptRoot 'ApiIntegrationTestChunkWatchdog.ps1')

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
Set-Location -LiteralPath $repoRoot

$chunkTimeoutSpan = ConvertTo-ChunkTimeoutSpan -ChunkTimeout $ChunkTimeout

New-Item -ItemType Directory -Force -Path $ResultsDirectory | Out-Null

Write-Host "Listing Integration tests (excluding Slow) from $ProjectPath ..."
$listOutput = & dotnet test $ProjectPath `
    --no-build `
    -c $Configuration `
    --filter $BaseFilter `
    --list-tests `
    2>&1 | ForEach-Object { $_.ToString() }

if ($LASTEXITCODE -ne 0) {
    throw "dotnet test --list-tests failed with exit code $LASTEXITCODE."
}

$allClassNames = ConvertFrom-DotNetTestListOutput -Lines $listOutput

if ($allClassNames.Count -eq 0) {
    throw 'No Integration test classes discovered; check --list-tests parsing or filter.'
}

$shardClassNames = Get-ApiIntegrationTestShardClassNames `
    -AllClassNames $allClassNames `
    -ShardIndex $ShardIndex `
    -ShardCount $ShardCount

$manifestPath = Join-Path $ResultsDirectory "integration-shard-$ShardIndex-of-$ShardCount.json"
$manifest = [ordered]@{
    shardIndex = $ShardIndex
    shardCount = $ShardCount
    totalIntegrationClasses = $allClassNames.Count
    assignedClassCount = $shardClassNames.Count
    assignedClasses = $shardClassNames
}
$manifest | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath $manifestPath -Encoding UTF8

Write-Host (
    "Shard {0}/{1}: {2} of {3} Integration classes assigned." -f
    ($ShardIndex + 1),
    $ShardCount,
    $shardClassNames.Count,
    $allClassNames.Count
)

Write-Host 'Shard identity:'
Write-Host ("  ShardIndex (0-based): {0}" -f $ShardIndex)
Write-Host ("  ShardIndex (display):  {0}/{1}" -f ($ShardIndex + 1), $ShardCount)
Write-Host ("  Assigned classes ({0}):" -f $shardClassNames.Count)

foreach ($className in $shardClassNames) {
    Write-Host ("    - {0}" -f $className)
}

if ($shardClassNames.Count -eq 0) {
    Write-Host 'Nothing to run on this shard.'
    exit 0
}

$filterChunks = @(Split-ApiIntegrationTestClassFilterChunks `
    -ClassNames $shardClassNames `
    -BaseFilter $BaseFilter `
    -ChunkSize $FilterChunkSize)

$diagLogPath = Join-Path $ResultsDirectory "vstest-api-integration-shard-$ShardIndex.diag.log"
$shardFailed = $false
$chunkNumber = 0

foreach ($filter in $filterChunks) {
    $chunkNumber++
    $chunkLabel = "Shard {0}/{1}: chunk {2}/{3}" -f ($ShardIndex + 1), $ShardCount, $chunkNumber, $filterChunks.Count
    Write-Host $chunkLabel

    $inGitHubActions = [bool]$env:GITHUB_ACTIONS

    if ($inGitHubActions) {
        Write-Host "::group::$chunkLabel"
    }

    Write-Host ("[{0}] Starting chunk {1}/{2} at {3}" -f
        $chunkLabel,
        $chunkNumber,
        $filterChunks.Count,
        (Get-Date -Format 'HH:mm:ss'))

    $filterText = [string]$filter

    if ([string]::IsNullOrWhiteSpace($filterText)) {
        throw "Generated empty filter for shard $ShardIndex chunk $chunkNumber."
    }

    try {
        $exitCode = Invoke-DotNetTestChunkWithWatchdog `
            -ProjectPath $ProjectPath `
            -Configuration $Configuration `
            -Filter $filterText `
            -RunSettingsPath $RunSettingsPath `
            -ResultsDirectory $ResultsDirectory `
            -ShardIndex $ShardIndex `
            -ChunkNumber $chunkNumber `
            -DiagLogPath $diagLogPath `
            -BlameHangTimeout $BlameHangTimeout `
            -ChunkTimeout $chunkTimeoutSpan

        if ($exitCode -ne 0) {
            $shardFailed = $true
        }
    }
    catch {
        $shardFailed = $true
        throw
    }
    finally {
        if ($inGitHubActions) {
            Write-Host '::endgroup::'
        }

        # On failure or blame-hang dump: emit SQL Server diagnostics so the next hang shows which
        # sessions were active/blocked and how many catalogs had accumulated on the container.
        if ($shardFailed -and ($IsLinux -or $inGitHubActions)) {
            Write-CiSqlServerHangDiagnostics
        }

        Write-Host ("[{0}] Chunk {1}/{2} finalized at {3} (failed: {4})" -f
            $chunkLabel,
            $chunkNumber,
            $filterChunks.Count,
            (Get-Date -Format 'HH:mm:ss'),
            $shardFailed)

        if ($IsLinux -or $inGitHubActions) {
            # Kill orphaned testhost/dotnet processes that prevent the GitHub Actions step from finishing
            Get-Process -Name 'dotnet', 'testhost' -ErrorAction SilentlyContinue |
                Where-Object { $_.Id -ne $PID } |
                Stop-Process -Force -ErrorAction SilentlyContinue
        }
    }
}

if ($shardFailed) {
    exit 1
}

exit 0
