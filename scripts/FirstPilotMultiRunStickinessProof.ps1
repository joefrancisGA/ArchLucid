#requires -Version 5.1
Set-StrictMode -Version Latest

function Resolve-FirstPilotStickinessBundleDirectory {
    param(
        [Parameter(Mandatory = $true)][string] $ProofDirectory,
        [Parameter(Mandatory = $true)][int] $RunNumber
    )

    if ($RunNumber -le 1) {
        return (Join-Path $ProofDirectory 'pilot-proof')
    }

    return (Join-Path $ProofDirectory "pilot-proof-run$RunNumber")
}

function Assert-FirstPilotMultiRunParameters {
    param(
        [int] $RunNumber,
        [string] $RunId,
        [string] $CompareBaseRunId
    )

    if ($RunNumber -lt 1) {
        throw 'RunNumber must be at least 1.'
    }

    if ($RunNumber -ge 2) {
        if ([string]::IsNullOrWhiteSpace($CompareBaseRunId)) {
            throw 'CompareBaseRunId is required when RunNumber is 2 or higher.'
        }

        if ([string]::IsNullOrWhiteSpace($RunId)) {
            throw 'RunId is required when RunNumber is 2 or higher.'
        }
    }
}

function Invoke-FirstPilotApiGetJson {
    param(
        [Parameter(Mandatory = $true)][string] $Url,
        [Parameter(Mandatory = $true)][hashtable] $Headers
    )

    $response = Invoke-WebRequest -Uri $Url -Headers $Headers -UseBasicParsing -TimeoutSec 120

    if ($response.StatusCode -lt 200 -or $response.StatusCode -ge 300) {
        throw "GET $Url returned HTTP $($response.StatusCode)."
    }

    return $response.Content | ConvertFrom-Json
}

function Get-FirstPilotGuidForApi {
    param([Parameter(Mandatory = $true)][string] $RunIdValue)

    $trimmed = $RunIdValue.Trim()

    try {
        return ([guid]$trimmed).ToString('D')
    }
    catch {
        return $trimmed
    }
}

function Get-FirstPilotStickinessSignals {
    param(
        [object] $ComparePayload,
        [object] $BaseDeltasPayload,
        [object] $CurrentDeltasPayload,
        [object] $DecisionsPayload
    )

    $findingsAdded = $null
    $findingsReduced = $null

    if ($null -ne $ComparePayload -and $null -ne $ComparePayload.manifestComparison) {
        $findingsAdded = [int]$ComparePayload.manifestComparison.addedCount
        $findingsReduced = [int]$ComparePayload.manifestComparison.removedCount
    }

    $cycleTimeDeltaMinutes = $null

    if ($null -ne $BaseDeltasPayload -and $null -ne $CurrentDeltasPayload) {
        $baseSeconds = $BaseDeltasPayload.timeToCommittedManifestTotalSeconds
        $currentSeconds = $CurrentDeltasPayload.timeToCommittedManifestTotalSeconds

        if ($null -ne $baseSeconds -and $null -ne $currentSeconds) {
            $cycleTimeDeltaMinutes = [math]::Round(([double]$currentSeconds - [double]$baseSeconds) / 60.0, 2)
        }
    }

    $governanceComplianceDelta = $null

    if ($null -ne $DecisionsPayload) {
        $governanceComplianceDelta = [int]$DecisionsPayload.totalDecisionItems
    }

    return [ordered]@{
        findingsReduced           = $findingsReduced
        findingsAdded             = $findingsAdded
        cycleTimeDeltaMinutes     = $cycleTimeDeltaMinutes
        governanceComplianceDelta = $governanceComplianceDelta
    }
}

function Write-FirstPilotMultiRunStickinessArtifacts {
    param(
        [Parameter(Mandatory = $true)][string] $ProofDirectory,
        [Parameter(Mandatory = $true)][int] $RunNumber,
        [Parameter(Mandatory = $true)][string] $NormalizedBase,
        [Parameter(Mandatory = $true)][hashtable] $Headers,
        [string] $RunId = '',
        [string] $CompareBaseRunId = ''
    )

    Assert-FirstPilotMultiRunParameters -RunNumber $RunNumber -RunId $RunId -CompareBaseRunId $CompareBaseRunId

    $bundleDir = Resolve-FirstPilotStickinessBundleDirectory -ProofDirectory $ProofDirectory -RunNumber $RunNumber
    New-Item -ItemType Directory -Force -Path $bundleDir | Out-Null

    if ($RunNumber -lt 2) {
        return $null
    }

    $baseGuid = Get-FirstPilotGuidForApi -RunIdValue $CompareBaseRunId
    $runGuid = Get-FirstPilotGuidForApi -RunIdValue $RunId
    $priorRunNumber = $RunNumber - 1

    $compareUrl = "$NormalizedBase/v1/authority/compare/runs?leftRunId=$baseGuid&rightRunId=$runGuid"
    $comparePath = Join-Path $bundleDir "compare-run$priorRunNumber-to-run$RunNumber.json"
    $comparePayload = Invoke-FirstPilotApiGetJson -Url $compareUrl -Headers $Headers
    $comparePayload | ConvertTo-Json -Depth 12 | Set-Content -LiteralPath $comparePath -Encoding UTF8

    $decisionsUrl = "$NormalizedBase/v1/governance/decisions-needed-summary"
    $decisionsPath = Join-Path $bundleDir "decisions-needed-summary-run$RunNumber.json"
    $decisionsPayload = Invoke-FirstPilotApiGetJson -Url $decisionsUrl -Headers $Headers
    $decisionsPayload | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $decisionsPath -Encoding UTF8

    $riskRegisterUrl = "$NormalizedBase/v1/governance/risk-register"
    $riskRegisterPath = Join-Path $bundleDir "risk-register-run$RunNumber.json"
    $riskRegisterPayload = Invoke-FirstPilotApiGetJson -Url $riskRegisterUrl -Headers $Headers
    $riskRegisterPayload | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $riskRegisterPath -Encoding UTF8

    $baseDeltasUrl = "$NormalizedBase/v1/pilots/runs/$([uri]::EscapeDataString($CompareBaseRunId.Trim()))/pilot-run-deltas"
    $currentDeltasUrl = "$NormalizedBase/v1/pilots/runs/$([uri]::EscapeDataString($RunId.Trim()))/pilot-run-deltas"
    $baseDeltasPayload = $null
    $currentDeltasPayload = $null

    try {
        $baseDeltasPayload = Invoke-FirstPilotApiGetJson -Url $baseDeltasUrl -Headers $Headers
    }
    catch {
        $baseDeltasPayload = $null
    }

    try {
        $currentDeltasPayload = Invoke-FirstPilotApiGetJson -Url $currentDeltasUrl -Headers $Headers
    }
    catch {
        $currentDeltasPayload = $null
    }

    $stickinessSignals = Get-FirstPilotStickinessSignals `
        -ComparePayload $comparePayload `
        -BaseDeltasPayload $baseDeltasPayload `
        -CurrentDeltasPayload $currentDeltasPayload `
        -DecisionsPayload $decisionsPayload

    return [ordered]@{
        bundleDirectory   = $bundleDir
        stickinessSignals = $stickinessSignals
        comparePath       = $comparePath
        decisionsPath     = $decisionsPath
        riskRegisterPath  = $riskRegisterPath
    }
}
