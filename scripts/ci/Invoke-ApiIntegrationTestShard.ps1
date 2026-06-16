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

    [string]$RunSettingsPath = 'coverage.runsettings',

    [int]$FilterChunkSize = 40,

    [string]$BlameHangTimeout = '75min'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

. (Join-Path $PSScriptRoot 'ApiIntegrationTestShardSupport.ps1')

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
Set-Location -LiteralPath $repoRoot

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

if ($shardClassNames.Count -eq 0) {
    Write-Host 'Nothing to run on this shard.'
    exit 0
}

$filterChunks = @(Split-ApiIntegrationTestClassFilterChunks `
    -ClassNames $shardClassNames `
    -BaseFilter $BaseFilter `
    -ChunkSize $FilterChunkSize)

$diagLogPath = Join-Path $ResultsDirectory "vstest-api-integration-shard-$ShardIndex.diag.log"
$failed = $false
$chunkNumber = 0

foreach ($filter in $filterChunks) {
    $chunkNumber++
    $chunkLabel = "Shard {0}/{1}: chunk {2}/{3}" -f ($ShardIndex + 1), $ShardCount, $chunkNumber, $filterChunks.Count
    Write-Host $chunkLabel

    $inGitHubActions = [bool]$env:GITHUB_ACTIONS

    if ($inGitHubActions) {
        Write-Host "::group::$chunkLabel"
    }

    try {
        & dotnet test $ProjectPath `
            --no-build `
            -c $Configuration `
            --settings $RunSettingsPath `
            --filter $filter `
            --collect:'XPlat Code Coverage' `
            --results-directory $ResultsDirectory `
            --logger 'console;verbosity=minimal' `
            --logger "trx;LogFilePrefix=full-core-api-integration-shard-$ShardIndex-chunk$chunkNumber-" `
            --diag $diagLogPath `
            --blame-hang `
            --blame-hang-timeout $BlameHangTimeout `
            --blame-hang-dump-type mini

        if ($LASTEXITCODE -ne 0) {
            $failed = $true
        }
    }
    finally {
        if ($inGitHubActions) {
            Write-Host '::endgroup::'
        }

        # On failure or blame-hang dump: emit SQL Server diagnostics so the next hang shows which
        # sessions were active/blocked and how many catalogs had accumulated on the container.
        if ($failed -and ($IsLinux -or $inGitHubActions)) {
            Write-Host '--- SQL Server diagnostics (post-hang) ---'

            $saPassword = $env:ARCHLUCID_CI_SQL_SA_PASSWORD
            if (-not $saPassword) { $saPassword = 'LocalTesting123!' }

            $sqlcmd = '/opt/mssql-tools18/bin/sqlcmd'
            if (-not (Test-Path $sqlcmd)) { $sqlcmd = 'sqlcmd' }

            $sqlArgs = @('-S', '127.0.0.1,1433', '-U', 'sa', '-P', $saPassword, '-C', '-Q')

            & $sqlcmd @sqlArgs @'
SELECT session_id, status, blocking_session_id, wait_type, wait_time_ms,
       DB_NAME(database_id) AS db_name, LEFT(sql_text.text, 200) AS sql_snippet
FROM sys.dm_exec_requests r
CROSS APPLY sys.dm_exec_sql_text(r.sql_handle) AS sql_text
WHERE session_id > 50
ORDER BY wait_time_ms DESC;
'@ -ErrorAction SilentlyContinue

            & $sqlcmd @sqlArgs @'
SELECT COUNT(*) AS blocked_session_count
FROM sys.dm_os_waiting_tasks
WHERE blocking_session_id IS NOT NULL AND blocking_session_id <> 0;
'@ -ErrorAction SilentlyContinue

            & $sqlcmd @sqlArgs @'
SELECT name, state_desc, log_reuse_wait_desc
FROM sys.databases
WHERE name LIKE 'ArchLucid%'
ORDER BY name;
'@ -ErrorAction SilentlyContinue
        }

        if ($IsLinux -or $inGitHubActions) {
            # Kill orphaned testhost/dotnet processes that prevent the GitHub Actions step from finishing
            Get-Process -Name 'dotnet', 'testhost' -ErrorAction SilentlyContinue |
                Where-Object { $_.Id -ne $PID } |
                Stop-Process -Force -ErrorAction SilentlyContinue
        }
    }
}

if ($failed) {
    exit 1
}

exit 0
