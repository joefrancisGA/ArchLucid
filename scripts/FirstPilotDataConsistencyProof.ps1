#requires -Version 5.1
Set-StrictMode -Version Latest

function Get-DataConsistencySummaryFromProofDirectory {
    param([Parameter(Mandatory = $true)][string] $ProofDirectory)

    $summaryPath = Join-Path $ProofDirectory 'data-consistency-readiness/data-consistency-summary.json'

    if (-not (Test-Path -LiteralPath $summaryPath)) {
        return $null
    }

    return Get-Content -LiteralPath $summaryPath -Raw | ConvertFrom-Json -ErrorAction Stop
}

function Get-DataConsistencyProofRollup {
    param(
        [Parameter(Mandatory = $true)][string] $Status,
        [object] $Summary = $null,
        [string] $ArtifactPath = 'data-consistency-readiness/data-consistency-summary.json'
    )

    $holdProbes = @()
    $warnProbes = @()
    $sponsorStopProbes = @()

    if ($null -ne $Summary) {
        foreach ($probe in @($Summary.probes)) {
            $probeStatus = [string]$probe.status

            if ($probeStatus -eq 'HOLD') {
                $holdProbes += $probe
            }
            elseif ($probeStatus -eq 'WARN') {
                $warnProbes += $probe
            }

            if ($probe.sponsorHandoffMustStop -eq $true -and ($probeStatus -eq 'HOLD' -or $probeStatus -eq 'WARN')) {
                $sponsorStopProbes += $probe
            }
        }
    }

    return [ordered]@{
        status                 = $Status
        artifactPath           = $ArtifactPath
        holdProbeCount         = $holdProbes.Count
        warnProbeCount         = $warnProbes.Count
        sponsorStopProbeCount  = $sponsorStopProbes.Count
        holdProbes             = @($holdProbes | ForEach-Object { [string]$_.probe })
        sponsorStopProbes      = @($sponsorStopProbes | ForEach-Object { [string]$_.probe })
    }
}

function Resolve-DataConsistencyProofFinding {
    param(
        [Parameter(Mandatory = $true)][string] $Status,
        [object] $Summary = $null,
        [switch] $SponsorHandoff,
        [string] $RunId = '',
        [int] $CollectorExitCode = 0
    )

    $rollup = Get-DataConsistencyProofRollup -Status $Status -Summary $Summary
    $runSuffix = if ([string]::IsNullOrWhiteSpace($RunId)) { '' } else { " Committed review runId=$($RunId.Trim())." }

    if ($Status -eq 'NOT_RUN') {
        $disposition = if ($SponsorHandoff) { 'BLOCK' } else { 'WARN' }

        return [ordered]@{
            disposition = $disposition
            detail      = 'Data-consistency readiness was not collected; sponsor handoff cannot be green without an explicit PASS/WARN/HOLD rollup.'
            remediation = 'Dry-run: ./scripts/collect-data-consistency-readiness.ps1 -BaseUrl $env:ARCHLUCID_API_URL; see docs/runbooks/DATA_CONSISTENCY_READINESS.md. Collectors do not delete or quarantine data.'
            rollup      = $rollup
        }
    }

    if ($Status -eq 'PASS') {
        return [ordered]@{
            disposition = 'PASS'
            detail      = 'Data-consistency readiness collector passed; see data-consistency-summary.json.'
            remediation = ''
            rollup      = $rollup
        }
    }

    if ($Status -eq 'HOLD') {
        $probeList = ($rollup.holdProbes -join ', ')

        if ([string]::IsNullOrWhiteSpace($probeList)) {
            $probeList = 'see summary'
        }

        return [ordered]@{
            disposition = 'BLOCK'
            detail      = "Data-consistency HOLD blocks sponsor handoff (probes: $probeList).$runSuffix Collector exit $CollectorExitCode."
            remediation = 'Inspect data-consistency-readiness/data-consistency-summary.json; dry-run: archlucid doctor --json (orphan probes); GET /health/diagnostics; remediation matrix: docs/library/DATA_CONSISTENCY_MATRIX.md — no auto-quarantine.'
            rollup      = $rollup
        }
    }

    $mustStop = $rollup.sponsorStopProbeCount -gt 0

    if ($SponsorHandoff -and $mustStop) {
        $probeList = ($rollup.sponsorStopProbes -join ', ')

        return [ordered]@{
            disposition = 'BLOCK'
            detail      = "Data-consistency WARN includes sponsor-stop probes ($probeList); resolve before sponsor send.$runSuffix"
            remediation = 'Inspect data-consistency-readiness/data-consistency-summary.json and /health/diagnostics before sponsor send.'
            rollup      = $rollup
        }
    }

    return [ordered]@{
        disposition = 'WARN'
        detail      = 'Data-consistency readiness completed with warnings; review orphan/diagnostics probes.'
        remediation = 'Inspect data-consistency-summary.json and /health/diagnostics before sponsor send.'
        rollup      = $rollup
    }
}

function Format-DataConsistencyProofMarkdownSection {
    param([object] $Rollup)

    if ($null -eq $Rollup) {
        return @()
    }

    $lines = [System.Collections.Generic.List[string]]::new()
    $lines.Add('')
    $lines.Add('## Data consistency proof')
    $lines.Add('')
    $lines.Add("| Field | Value |")
    $lines.Add("| --- | --- |")
    $lines.Add("| Status | **$($Rollup.status)** |")
    $lines.Add("| Summary artifact | ``$($Rollup.artifactPath)`` |")
    $lines.Add("| HOLD probes | $($Rollup.holdProbeCount) |")
    $lines.Add("| WARN probes | $($Rollup.warnProbeCount) |")
    $lines.Add("| Sponsor-stop probes | $($Rollup.sponsorStopProbeCount) |")
    $lines.Add('')
    $lines.Add('Dry-run remediation only — collectors do not mutate data.')
    $lines.Add('')

    return $lines
}
