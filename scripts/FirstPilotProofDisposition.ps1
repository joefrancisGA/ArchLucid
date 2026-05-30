#requires -Version 5.1
Set-StrictMode -Version Latest

function Get-KnownDeferredBuyerRequirementTokens {
    return @(
        'SOC 2 CPA',
        'SOC2 CPA',
        'public reference customer',
        'live marketplace checkout',
        'marketplace checkout',
        'MCP',
        'Jira connector',
        'ServiceNow connector',
        'Confluence connector',
        'Slack connector',
        'Teams connector',
        'CloudEvents connector',
        'third-party pen test',
        'pen-test attestation'
    )
}

function Get-DeferredScopeReasonsFromText {
    param([string] $Text)

    if ([string]::IsNullOrWhiteSpace($Text)) {
        return @()
    }

    $reasons = [System.Collections.Generic.List[string]]::new()

    foreach ($token in Get-KnownDeferredBuyerRequirementTokens) {
        if ($Text -like "*$token*") {
            $reasons.Add($token)
        }
    }

    return @($reasons | Select-Object -Unique)
}

function Resolve-DeferredScopeReasons {
    param(
        [string[]] $ExplicitRequirements = @(),
        [string] $ProcurementReportText = ''
    )

    $reasons = [System.Collections.Generic.List[string]]::new()

    foreach ($item in @($ExplicitRequirements)) {
        if (-not [string]::IsNullOrWhiteSpace($item)) {
            $reasons.Add($item.Trim())
        }
    }

    foreach ($item in Get-DeferredScopeReasonsFromText -Text $ProcurementReportText) {
        $reasons.Add($item)
    }

    return @($reasons | Select-Object -Unique)
}

function Resolve-RoiBasisStatus {
    param(
        [string] $RoiConfidenceLabel,
        [bool] $IsDemoTenant,
        [string] $RoiEvidenceConfidence = '',
        [string] $SponsorProofReadiness = ''
    )

    if ($IsDemoTenant) {
        return 'demo-derived'
    }

    if ([string]::IsNullOrWhiteSpace($RoiConfidenceLabel)) {
        return 'not-collected'
    }

    $normalized = $RoiConfidenceLabel.Trim().ToLowerInvariant()

    if ($normalized -like '*tenant-supplied*' -or $normalized -like '*buyer-provided*') {
        return 'buyer-provided'
    }

    if ($normalized -like '*uploaded actual*' -or $normalized -like '*uploaded amortized*') {
        return 'uploaded-actual-or-amortized'
    }

    if ($normalized -like '*azure retail*') {
        return 'azure-retail'
    }

    if ($normalized -like '*defaulted*') {
        return 'defaulted'
    }

    if ($normalized -like '*no measurement yet*' -or $normalized -like '*not collected*') {
        return 'missing'
    }

    if ($RoiEvidenceConfidence -eq 'Low' -or $SponsorProofReadiness -eq 'NeedsBaseline') {
        return 'missing'
    }

    if ($normalized -like '*stale*') {
        return 'stale'
    }

    return 'labeled-other'
}

function Test-RoiBasisSponsorSafe {
    param(
        [string] $RoiBasisStatus,
        [switch] $AllowCaveatedUnsafeBasis
    )

    switch ($RoiBasisStatus) {
        'buyer-provided' { return $true }
        'uploaded-actual-or-amortized' { return $true }
        'azure-retail' { return $true }
        'labeled-other' { return $true }
        'defaulted' { return [bool]$AllowCaveatedUnsafeBasis }
        'demo-derived' { return [bool]$AllowCaveatedUnsafeBasis }
        'missing' { return [bool]$AllowCaveatedUnsafeBasis }
        'not-collected' { return [bool]$AllowCaveatedUnsafeBasis }
        'stale' { return [bool]$AllowCaveatedUnsafeBasis }
        default { return $false }
    }
}

function Resolve-DataConsistencyStatusFromCollector {
    param(
        [int] $CollectorExitCode,
        [switch] $Skipped
    )

    if ($Skipped) {
        return 'NOT_RUN'
    }

    switch ($CollectorExitCode) {
        0 { return 'PASS' }
        2 { return 'WARN' }
        default { return 'HOLD' }
    }
}

function Resolve-SponsorPacketDisposition {
    param(
        [switch] $SponsorHandoff,
        [int] $BlockCount,
        [int] $WarnCount = 0,
        [string[]] $DeferredScopeReasons = @()
    )

    if (-not $SponsorHandoff) {
        return 'READINESS_ONLY'
    }

    if ($BlockCount -gt 0) {
        return 'HOLD'
    }

    if (@($DeferredScopeReasons).Count -gt 0) {
        return 'DEFERRED_SCOPE'
    }

    if ($WarnCount -gt 0) {
        return 'WARN'
    }

    return 'READY'
}

function Get-BlockingReasonsFromFindings {
    param([object[]] $Findings)

    return @(
        $Findings |
            Where-Object { $_.disposition -eq 'BLOCK' } |
            ForEach-Object {
                [ordered]@{
                    name        = [string]$_.name
                    detail      = [string]$_.detail
                    remediation = [string]$_.remediation
                    triageCard  = [string]$_.triageCard
                }
            }
    )
}

function Get-QualityGateHoldDetail {
    param(
        [string] $QualityGateDisposition,
        [string] $QualityGateMode = '',
        [bool] $UnresolvedQualitySignalsPresent = $false
    )

    switch ($QualityGateDisposition) {
        'pilot-strict-violates-sponsor-evidence' {
            return "PilotStrict rejected sponsor evidence (mode=$QualityGateMode)."
        }
        'pilot-strict-signals-unresolved' {
            return "PilotStrict signals unresolved (mode=$QualityGateMode)."
        }
        default {
            if ($UnresolvedQualitySignalsPresent) {
                return "Unresolved quality signals remain (mode=$QualityGateMode; disposition=$QualityGateDisposition)."
            }

            return "Quality gate disposition '$QualityGateDisposition' is not sponsor-safe (mode=$QualityGateMode)."
        }
    }
}

function Get-RegisteredTriageCardIdsFromMarkdown {
    param([Parameter(Mandatory = $true)][string] $MarkdownPath)

    if (-not (Test-Path -LiteralPath $MarkdownPath)) {
        return @()
    }

    $text = Get-Content -LiteralPath $MarkdownPath -Raw
    $matches = [regex]::Matches($text, '\|\s*(FP-T\d{3})\s*\|')

    return @($matches | ForEach-Object { $_.Groups[1].Value } | Select-Object -Unique)
}

function Test-TriageCardIdsResolve {
    param(
        [Parameter(Mandatory = $true)][string[]] $UsedTriageCardIds,
        [Parameter(Mandatory = $true)][string[]] $RegisteredTriageCardIds
    )

    $missing = @($UsedTriageCardIds | Where-Object { $_ -and ($RegisteredTriageCardIds -notcontains $_) })

    return [ordered]@{
        valid   = ($missing.Count -eq 0)
        missing = $missing
    }
}
