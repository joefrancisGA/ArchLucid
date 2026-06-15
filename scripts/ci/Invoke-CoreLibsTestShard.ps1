# Runs one CI shard of non-Api test assemblies (Category!=Slow).
param(
    [Parameter(Mandatory)]
    [int]$ShardIndex,

    [int]$ShardCount = 4,

    [string]$Configuration = 'Release',

    [Parameter(Mandatory)]
    [string]$ResultsDirectory,

    [string]$Filter = 'Category!=Slow',

    [string]$RunSettingsPath = 'coverage.runsettings',

    [string]$BlameHangTimeout = '30min',

    [string]$BlameHangDumpType = 'mini'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

. (Join-Path $PSScriptRoot 'CoreLibsTestShardSupport.ps1')

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
Set-Location -LiteralPath $repoRoot

New-Item -ItemType Directory -Force -Path $ResultsDirectory | Out-Null

$allProjectPaths = Get-NonApiTestProjectPathsFromSolution

if ($allProjectPaths.Count -eq 0) {
    throw 'No non-Api *.Tests.csproj entries from dotnet sln list (expected at least one).'
}

$shardProjectPaths = Get-CoreLibsTestShardProjectPaths `
    -AllProjectPaths $allProjectPaths `
    -ShardIndex $ShardIndex `
    -ShardCount $ShardCount

$manifestPath = Join-Path $ResultsDirectory "core-libs-shard-$ShardIndex-of-$ShardCount.json"
$manifest = [ordered]@{
    shardIndex = $ShardIndex
    shardCount = $ShardCount
    totalTestProjects = $allProjectPaths.Count
    assignedProjectCount = $shardProjectPaths.Count
    assignedProjects = $shardProjectPaths
}
$manifest | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath $manifestPath -Encoding UTF8

Write-Host (
    "Shard {0}/{1}: {2} of {3} non-Api test projects assigned." -f
    ($ShardIndex + 1),
    $ShardCount,
    $shardProjectPaths.Count,
    $allProjectPaths.Count
)

if ($shardProjectPaths.Count -eq 0) {
    Write-Host 'Nothing to run on this shard.'
    exit 0
}

$failed = $false

foreach ($projectPath in $shardProjectPaths) {
    $projectLabel = "Shard {0}/{1}: {2}" -f ($ShardIndex + 1), $ShardCount, $projectPath
    Write-Host $projectLabel

    $inGitHubActions = [bool]$env:GITHUB_ACTIONS

    if ($inGitHubActions) {
        Write-Host "::group::$projectLabel"
    }

    try {
        & dotnet test $projectPath `
            --no-build `
            -c $Configuration `
            --settings $RunSettingsPath `
            --filter $Filter `
            --collect:'XPlat Code Coverage' `
            --results-directory $ResultsDirectory `
            --logger 'console;verbosity=minimal' `
            --logger "trx;LogFilePrefix=full-core-libs-shard-$ShardIndex-" `
            --blame-hang `
            --blame-hang-timeout $BlameHangTimeout `
            --blame-hang-dump-type $BlameHangDumpType

        if ($LASTEXITCODE -ne 0) {
            $failed = $true
        }
    }
    finally {
        if ($inGitHubActions) {
            Write-Host '::endgroup::'
        }
    }
}

if ($failed) {
    exit 1
}

exit 0
