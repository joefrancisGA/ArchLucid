#Requires -Version 5.1
Set-StrictMode -Version Latest

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

    throw @"
AL_BUG_HUNT_RUN_LOG entry$locationHint for zone '$zoneHint' is missing a usable timestamp.
Canonical field is 'at' (ISO-8601 UTC). Legacy alias 'recordedAt' is accepted.
Repair the append-only log or re-record via scripts/agent/al-bug-rolling-stats.ps1 -RecordHunt; do not hand-append non-canonical rows.
"@
}
