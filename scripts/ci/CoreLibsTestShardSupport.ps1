# Shared helpers for splitting non-Api *.Tests.csproj workloads across CI shards.
Set-StrictMode -Version Latest

function Get-NonApiTestProjectPathsFromSolution {
    param(
        [string]$SolutionPath = 'ArchLucid.sln'
    )

    $listOutput = & dotnet sln $SolutionPath list 2>&1 | ForEach-Object { $_.ToString() }

    if ($LASTEXITCODE -ne 0) {
        throw "dotnet sln list failed with exit code $LASTEXITCODE."
    }

    $projects = [System.Collections.Generic.List[string]]::new()

    foreach ($line in $listOutput) {
        $trimmed = $line.Trim()

        if (-not $trimmed.EndsWith('.Tests.csproj', [StringComparison]::OrdinalIgnoreCase)) {
            continue
        }

        if ($trimmed -match 'Api\.Tests\.csproj$') {
            continue
        }

        $projects.Add($trimmed)
    }

    return ,@($projects | Sort-Object)
}

function Get-CoreLibsTestShardProjectPaths {
    param(
        [Parameter(Mandatory)]
        [string[]]$AllProjectPaths,

        [Parameter(Mandatory)]
        [int]$ShardIndex,

        [Parameter(Mandatory)]
        [int]$ShardCount
    )

    if ($ShardIndex -lt 0 -or $ShardIndex -ge $ShardCount) {
        throw "ShardIndex must be in [0, $($ShardCount - 1)]. Actual: $ShardIndex."
    }

    $assigned = [System.Collections.Generic.List[string]]::new()

    for ($index = 0; $index -lt $AllProjectPaths.Count; $index++) {
        if ($index % $ShardCount -ne $ShardIndex) {
            continue
        }

        $assigned.Add($AllProjectPaths[$index])
    }

    return ,@($assigned.ToArray())
}
