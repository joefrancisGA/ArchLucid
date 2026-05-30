# Shared helpers for splitting ArchLucid.Api.Tests Integration (non-Slow) across CI shards.
Set-StrictMode -Version Latest

function ConvertFrom-DotNetTestListOutput {
    param(
        [Parameter(Mandatory)]
        [string[]]$Lines
    )

    $classNames = [System.Collections.Generic.HashSet[string]]::new([StringComparer]::Ordinal)

    foreach ($line in $Lines) {
        $trimmed = $line.Trim()

        if ([string]::IsNullOrWhiteSpace($trimmed)) {
            continue
        }

        if ($trimmed.StartsWith('The following', [StringComparison]::Ordinal)) {
            continue
        }

        if ($trimmed.StartsWith('Total tests:', [StringComparison]::Ordinal)) {
            continue
        }

        if ($trimmed -notmatch '\.') {
            continue
        }

        $testName = $trimmed

        $parenIndex = $testName.IndexOf('(')

        if ($parenIndex -ge 0) {
            $testName = $testName.Substring(0, $parenIndex)
        }

        $lastDot = $testName.LastIndexOf('.')

        if ($lastDot -le 0) {
            continue
        }

        $className = $testName.Substring(0, $lastDot)
        [void]$classNames.Add($className)
    }

    return @($classNames | Sort-Object)
}

function Get-ApiIntegrationTestShardClassNames {
    param(
        [Parameter(Mandatory)]
        [string[]]$AllClassNames,

        [Parameter(Mandatory)]
        [int]$ShardIndex,

        [Parameter(Mandatory)]
        [int]$ShardCount
    )

    if ($ShardIndex -lt 0 -or $ShardIndex -ge $ShardCount) {
        throw "ShardIndex must be in [0, $($ShardCount - 1)]. Actual: $ShardIndex."
    }

    $assigned = [System.Collections.Generic.List[string]]::new()

    for ($index = 0; $index -lt $AllClassNames.Count; $index++) {
        if ($index % $ShardCount -ne $ShardIndex) {
            continue
        }

        $assigned.Add($AllClassNames[$index])
    }

    return @($assigned)
}

function New-ApiIntegrationTestClassFilter {
    param(
        [Parameter(Mandatory)]
        [string[]]$ClassNames,

        [Parameter(Mandatory)]
        [string]$BaseFilter
    )

    if ($ClassNames.Count -eq 0) {
        return $null
    }

    $fullyQualifiedParts = $ClassNames | ForEach-Object { "FullyQualifiedName~$_" }
    $classFilter = '(' + ($fullyQualifiedParts -join '|') + ')'

    return "$BaseFilter&$classFilter"
}

function Split-ApiIntegrationTestClassFilterChunks {
    param(
        [Parameter(Mandatory)]
        [string[]]$ClassNames,

        [Parameter(Mandatory)]
        [string]$BaseFilter,

        [int]$ChunkSize = 40
    )

    if ($ChunkSize -le 0) {
        throw 'ChunkSize must be positive.'
    }

    $chunks = [System.Collections.Generic.List[string]]::new()

    for ($offset = 0; $offset -lt $ClassNames.Count; $offset += $ChunkSize) {
        $take = [Math]::Min($ChunkSize, $ClassNames.Count - $offset)
        $slice = $ClassNames[$offset..($offset + $take - 1)]
        $filter = New-ApiIntegrationTestClassFilter -ClassNames $slice -BaseFilter $BaseFilter

        if ($null -ne $filter) {
            $chunks.Add($filter)
        }
    }

    return @($chunks)
}
