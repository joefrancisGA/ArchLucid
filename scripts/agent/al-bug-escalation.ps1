#Requires -Version 5.1
Set-StrictMode -Version Latest

function Read-EscalationRunLogEntries {
    param([string] $Path)

    if ([string]::IsNullOrWhiteSpace($Path) -or -not (Test-Path -LiteralPath $Path)) {
        return @()
    }

    $entries = @()
    $lines = Get-Content -LiteralPath $Path -Encoding UTF8

    foreach ($line in $lines) {
        if ([string]::IsNullOrWhiteSpace($line)) {
            continue
        }

        try {
            $entries += ,($line | ConvertFrom-Json)
        }
        catch {
            throw "Invalid JSONL line in '$Path': $line"
        }
    }

    return $entries
}

function ConvertTo-EscalationUtcDateTime {
    param([string] $IsoTimestamp)

    return [datetime]::SpecifyKind(
        [datetime]::Parse(
            $IsoTimestamp,
            $null,
            [System.Globalization.DateTimeStyles]::AdjustToUniversal -bor [System.Globalization.DateTimeStyles]::AssumeUniversal
        ),
        [System.DateTimeKind]::Utc
    )
}

function Test-IsProductionEscalationPath {
    param([string] $Path)

    if ([string]::IsNullOrWhiteSpace($Path)) {
        return $false
    }

    $normalized = $Path.Replace('\', '/')

    if ($normalized -match '(?i)Tests|__tests__|\.md$|\.generated\.') {
        return $false
    }

    return $true
}

function Get-GitProductionPathsFromLogText {
    param([string] $GitLogText)

    if ([string]::IsNullOrWhiteSpace($GitLogText)) {
        return @()
    }

    $paths = New-Object System.Collections.Generic.HashSet[string]

    foreach ($line in ($GitLogText -split '\r?\n')) {
        $trimmed = $line.Trim()

        if ([string]::IsNullOrWhiteSpace($trimmed)) {
            continue
        }

        if (Test-IsProductionEscalationPath -Path $trimmed) {
            [void]$paths.Add($trimmed.Replace('\', '/'))
        }
    }

    return @($paths)
}

function Get-GitBugsmashProductionPaths {
    param(
        [string] $GitRepoRoot,
        [int] $WindowDays = 7
    )

    $since = (Get-Date).ToUniversalTime().AddDays(-1 * $WindowDays).ToString('yyyy-MM-dd')
    $output = & git -C $GitRepoRoot log "origin/bugsmash" --since=$since --name-only --pretty=format: 2>$null

    if ($LASTEXITCODE -ne 0) {
        $output = & git -C $GitRepoRoot log --since=$since --name-only --pretty=format: 2>$null
    }

    return Get-GitProductionPathsFromLogText -GitLogText (($output | Out-String))
}

function Get-EscalatedProductionFiles {
    param(
        [object[]] $RunLogEntries,
        [string] $GitLogText,
        [datetime] $NowUtc,
        [int] $HitThreshold = 3,
        [int] $WindowDays = 7
    )

    $cutoff = $NowUtc.AddDays(-1 * $WindowDays)
    $fileHits = @{}

    foreach ($entry in @($RunLogEntries)) {
        if ($null -eq $entry) {
            continue
        }

        if ([string]$entry.outcome -ne 'hit') {
            continue
        }

        $at = ConvertTo-EscalationUtcDateTime -IsoTimestamp ([string]$entry.at)

        if ($at -lt $cutoff) {
            continue
        }

        foreach ($path in @($entry.paths)) {
            if (-not (Test-IsProductionEscalationPath -Path ([string]$path))) {
                continue
            }

            $normalized = ([string]$path).Replace('\', '/')

            if (-not $fileHits.ContainsKey($normalized)) {
                $fileHits[$normalized] = 0
            }

            $fileHits[$normalized]++
        }
    }

    foreach ($path in (Get-GitProductionPathsFromLogText -GitLogText $GitLogText)) {
        if (-not $fileHits.ContainsKey($path)) {
            $fileHits[$path] = 0
        }

        $fileHits[$path]++
    }

    return @(
        $fileHits.GetEnumerator() |
            Where-Object { $_.Value -ge $HitThreshold } |
            ForEach-Object { $_.Key } |
            Sort-Object
    )
}

function Test-AlBugShouldHoldHit {
    param(
        [string] $Severity,
        [string[]] $EscalatedFiles,
        [string[]] $ChangedPaths
    )

    $normalizedSeverity = $(if ([string]::IsNullOrWhiteSpace($Severity)) { 'medium' } else { $Severity.Trim().ToLowerInvariant() })

    if ($normalizedSeverity -eq 'low') {
        return $true
    }

    foreach ($changed in @($ChangedPaths)) {
        $normalized = $changed.Replace('\', '/')

        foreach ($escalated in @($EscalatedFiles)) {
            if ($normalized -eq $escalated -or $normalized.StartsWith($escalated, [StringComparison]::OrdinalIgnoreCase)) {
                return $true
            }
        }
    }

    return $false
}
