# Runs one CI shard of ArchLucid.Api.Tests Integration tests (Category=Integration, Category!=Slow).
param(
    [Parameter(Mandatory)]
    [int]$ShardIndex,

    [int]$ShardCount = 3,

    [string]$ProjectPath = 'ArchLucid.Api.Tests/ArchLucid.Api.Tests.csproj',

    [string]$Configuration = 'Release',

    [Parameter(Mandatory)]
    [string]$ResultsDirectory,

    [string]$BaseFilter = 'Category!=Slow&Category=Integration',

    [string]$RunSettingsPath = 'coverage.runsettings',

    [int]$FilterChunkSize = 40,

    [string]$BlameHangTimeout = '45min'
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

$filterChunks = Split-ApiIntegrationTestClassFilterChunks `
    -ClassNames $shardClassNames `
    -BaseFilter $BaseFilter `
    -ChunkSize $FilterChunkSize

$diagLogPath = Join-Path $ResultsDirectory "vstest-api-integration-shard-$ShardIndex.diag.log"
$failed = $false
$chunkNumber = 0

foreach ($filter in $filterChunks) {
    $chunkNumber++
    Write-Host (
        "Shard {0}/{1}: running chunk {2}/{3}." -f
        ($ShardIndex + 1),
        $ShardCount,
        $chunkNumber,
        $filterChunks.Count
    )

    & dotnet test $ProjectPath `
        --no-build `
        -c $Configuration `
        --settings $RunSettingsPath `
        --filter $filter `
        --collect:'XPlat Code Coverage' `
        --results-directory $ResultsDirectory `
        --logger 'console;verbosity=normal' `
        --logger "trx;LogFilePrefix=full-core-api-integration-shard-$ShardIndex-chunk$chunkNumber-" `
        --diag $diagLogPath `
        --blame-hang `
        --blame-hang-timeout $BlameHangTimeout

    if ($LASTEXITCODE -ne 0) {
        $failed = $true
    }
}

if ($failed) {
    exit 1
}

exit 0
