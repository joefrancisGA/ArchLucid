#Requires -Version 5.1
Set-StrictMode -Version Latest

function Get-RunLogEntryMissingTimestampMessage {
    param(
        [Parameter(Mandatory)]
        [object] $Entry,

        [int] $SourceLineNumber = 0,

        [string] $SourcePath = ''
    )

    $zoneHint = 'unknown'

    if ($Entry.PSObject.Properties.Name.Contains('zoneId')) {
        $zoneHint = [string]$Entry.zoneId
    }

    $locationHint = ''

    if ($SourceLineNumber -gt 0) {
        $locationHint = " at JSONL line $SourceLineNumber"
    }

    if (-not [string]::IsNullOrWhiteSpace($SourcePath)) {
        $locationHint += " in '$SourcePath'"
    }

    return @"
AL_BUG_HUNT_RUN_LOG entry$locationHint for zone '$zoneHint' is missing a usable timestamp.
Canonical field is 'at' (ISO-8601 UTC). Legacy alias 'recordedAt' is accepted.
Repair the append-only log or re-record via scripts/agent/al-bug-rolling-stats.ps1 -RecordHunt; do not hand-append non-canonical rows.
"@
}

function Test-RunLogEntryHasCanonicalTimestamp {
    param(
        [Parameter(Mandatory)]
        [object] $Entry
    )

    if ($null -eq $Entry) {
        return $false
    }

    foreach ($propertyName in @('at', 'recordedAt')) {
        if (-not $Entry.PSObject.Properties.Name.Contains($propertyName)) {
            continue
        }

        $value = $Entry.$propertyName

        if ($null -ne $value -and -not [string]::IsNullOrWhiteSpace([string]$value)) {
            return $true
        }
    }

    return $false
}

function Get-RunLogEntryIsoTimestamp {
    param(
        [Parameter(Mandatory)]
        [object] $Entry,

        [int] $SourceLineNumber = 0,

        [string] $SourcePath = ''
    )

    if ($null -eq $Entry) {
        throw 'Run log entry is null.'
    }

    foreach ($propertyName in @('at', 'recordedAt')) {
        if (-not $Entry.PSObject.Properties.Name.Contains($propertyName)) {
            continue
        }

        $value = $Entry.$propertyName

        if ($null -ne $value -and -not [string]::IsNullOrWhiteSpace([string]$value)) {
            return [string]$value
        }
    }

    throw (Get-RunLogEntryMissingTimestampMessage -Entry $Entry -SourceLineNumber $SourceLineNumber -SourcePath $SourcePath)
}

function Get-HuntRunLogPhysicalLineCount {
    param(
        [Parameter(Mandatory)]
        [string] $Path
    )

    if (-not (Test-Path -LiteralPath $Path)) {
        return 0
    }

    $count = 0
    $reader = [System.IO.StreamReader]::new($Path)

    try {
        while ($null -ne $reader.ReadLine()) {
            $count++
        }
    }
    finally {
        $reader.Dispose()
    }

    return $count
}

function Add-HuntRunLogEntryLine {
    param(
        [Parameter(Mandatory)]
        [string] $Path,

        [Parameter(Mandatory)]
        [string] $JsonLine
    )

    if ([string]::IsNullOrWhiteSpace($JsonLine)) {
        throw 'Cannot append an empty hunt run log line.'
    }

    $parent = Split-Path -Parent $Path

    if (-not [string]::IsNullOrWhiteSpace($parent) -and -not (Test-Path -LiteralPath $parent)) {
        New-Item -ItemType Directory -Path $parent -Force | Out-Null
    }

    $utf8NoBom = [System.Text.UTF8Encoding]::new($false)
    $payload = $JsonLine.TrimEnd() + [Environment]::NewLine

    if (-not (Test-Path -LiteralPath $Path)) {
        [System.IO.File]::WriteAllText($Path, $payload, $utf8NoBom)
        return
    }

    $stream = [System.IO.FileStream]::new(
        $Path,
        [System.IO.FileMode]::Append,
        [System.IO.FileAccess]::Write,
        [System.IO.FileShare]::Read)

    try {
        $writer = [System.IO.StreamWriter]::new($stream, $utf8NoBom)
        $writer.Write($payload)
        $writer.Flush()
        $writer.Dispose()
    }
    finally {
        $stream.Dispose()
    }
}

function Rewrite-HuntRunLogWithLineCountGuard {
    param(
        [Parameter(Mandatory)]
        [string] $Path,

        [Parameter(Mandatory)]
        [string[]] $NewLines,

        [switch] $AllowLineCountDecrease
    )

    $beforeCount = Get-HuntRunLogPhysicalLineCount -Path $Path
    $normalized = @(
        $NewLines | Where-Object { -not [string]::IsNullOrWhiteSpace($_) }
    )
    $afterCount = $normalized.Count

    if (-not $AllowLineCountDecrease -and $afterCount -lt $beforeCount) {
        throw @"
AL_BUG_HUNT_RUN_LOG rewrite aborted: line count would decrease from $beforeCount to $afterCount.
Use append-only -RecordHunt for new events. Retention prune must pass -AllowLineCountDecrease explicitly.
"@
    }

    $parent = Split-Path -Parent $Path

    if (-not [string]::IsNullOrWhiteSpace($parent) -and -not (Test-Path -LiteralPath $parent)) {
        New-Item -ItemType Directory -Path $parent -Force | Out-Null
    }

    $tempPath = [string]::Empty

    try {
        $tempPath = [System.IO.Path]::Combine(
            [System.IO.Path]::GetTempPath(),
            ('al-bug-hunt-run-log-{0}.tmp' -f [Guid]::NewGuid().ToString('N')))

        $utf8NoBom = [System.Text.UTF8Encoding]::new($false)

        if ($normalized.Count -eq 0) {
            if ($beforeCount -gt 0 -and -not $AllowLineCountDecrease) {
                throw "AL_BUG_HUNT_RUN_LOG rewrite aborted: would truncate $beforeCount lines to an empty file."
            }

            [System.IO.File]::WriteAllText($tempPath, '', $utf8NoBom)
        }
        else {
            [System.IO.File]::WriteAllLines($tempPath, $normalized, $utf8NoBom)
        }

        if (Test-Path -LiteralPath $Path) {
            [System.IO.File]::Move($tempPath, $Path, $true)
        }
        else {
            [System.IO.File]::Move($tempPath, $Path)
        }

        $tempPath = [string]::Empty
    }
    finally {
        if (-not [string]::IsNullOrWhiteSpace($tempPath) -and (Test-Path -LiteralPath $tempPath)) {
            Remove-Item -LiteralPath $tempPath -Force
        }
    }
}
