#requires -Version 5.1
<#
.SYNOPSIS
  Repeatable policy-pack delta demo — baseline vs strict pre-commit dry-run on one committed run.

.DESCRIPTION
  Implements improvement #2 (assessment LATEST_GPT55): same run, different enforcement overrides,
  governance dry-run + pre-commit simulation + optional audit CSV slice. Read-only except audit export download.

.PARAMETER BaseUrl
  API root without trailing slash (defaults to ARCHLUCID_API_URL or http://127.0.0.1:5128).

.PARAMETER RunId
  Committed architecture review run id (GUID or 32-char hex).

.PARAMETER OutputDirectory
  Parent folder for timestamped demo artifacts (default: artifacts/policy-pack-delta-demo).

.PARAMETER TenantId
  Optional scope header X-Tenant-Id.

.PARAMETER WorkspaceId
  Optional scope header X-Workspace-Id.

.PARAMETER ProjectId
  Optional scope header X-Project-Id.

.PARAMETER ShowFindingDelta
  When set, dry-runs bundled SOC 2 vs CIS Azure sample pack JSON against the same run and prints
  compliance rule-key sets side by side. Finding-level proof for declaration and topology extras
  remains the offline golden tests (see docs/quality/policy-filter-golden-delta.md).

.EXAMPLE
  .\scripts\demo-policy-pack-delta.ps1 -RunId eb81dd4972ad429e8d4e214f9934bfc0
#>
param(
    [string] $BaseUrl = '',
    [Parameter(Mandatory = $true)]
    [string] $RunId,
    [string] $OutputDirectory = 'artifacts/policy-pack-delta-demo',
    [string] $BearerToken = '',
    [string] $ApiKey = '',
    [string] $TenantId = '',
    [string] $WorkspaceId = '',
    [string] $ProjectId = '',
    [switch] $ShowFindingDelta
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

. (Join-Path $PSScriptRoot 'ArchLucid.AuthHeaders.ps1')

if ([string]::IsNullOrWhiteSpace($BaseUrl)) {
    $BaseUrl = $env:ARCHLUCID_API_URL
}

if ([string]::IsNullOrWhiteSpace($BaseUrl)) {
    $BaseUrl = 'http://127.0.0.1:5128'
}

$normalizedBase = $BaseUrl.Trim().TrimEnd('/')
$runIdNormalized = $RunId.Trim()
$timestamp = (Get-Date).ToUniversalTime().ToString('yyyyMMddTHHmmssZ')
$outRoot = if ([System.IO.Path]::IsPathRooted($OutputDirectory)) { $OutputDirectory } else { Join-Path (Get-Location).Path $OutputDirectory }
$bundleDir = Join-Path $outRoot "policy-pack-delta-$timestamp"
New-Item -ItemType Directory -Force -Path $bundleDir | Out-Null

$authHeaders = Get-ArchLucidHttpAuthHeadersHashtable -BearerToken $BearerToken -ApiKey $ApiKey
$headers = Merge-ArchLucidHttpScopeHeaders -Headers $authHeaders -TenantId $TenantId -WorkspaceId $WorkspaceId -ProjectId $ProjectId

function Invoke-ArchLucidJson {
    param(
        [Parameter(Mandatory = $true)][ValidateSet('Get', 'Post')][string] $Method,
        [Parameter(Mandatory = $true)][string] $RelativePath,
        [object] $Body = $null
    )

    $uri = "$normalizedBase$RelativePath"
    $req = @{
        Uri             = $uri
        Method          = $Method
        UseBasicParsing = $true
        TimeoutSec      = 120
    }

    if ($headers.Count -gt 0) {
        $req.Headers = $headers
    }

    if ($Method -eq 'Post') {
        $json = $Body | ConvertTo-Json -Depth 20 -Compress
        $req.ContentType = 'application/json; charset=utf-8'
        $req.Body = [System.Text.Encoding]::UTF8.GetBytes($json)
    }

    try {
        $response = Invoke-WebRequest @req
        $text = [System.Text.Encoding]::UTF8.GetString($response.Content)

        if ([string]::IsNullOrWhiteSpace($text)) {
            return $null
        }

        return $text | ConvertFrom-Json
    }
    catch {
        $detail = $_.Exception.Message

        if ($null -ne $_.Exception.Response) {
            try {
                $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
                $bodyText = $reader.ReadToEnd()
                $reader.Close()

                if (-not [string]::IsNullOrWhiteSpace($bodyText)) {
                    $detail = $bodyText
                }
            }
            catch {
                # keep original message
            }
        }

        throw "$Method $RelativePath failed: $detail"
    }
}

function Read-PolicyPackContentJson {
    param(
        [Parameter(Mandatory = $true)][string] $RelativePathFromRepoRoot
    )

    $repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
    $fullPath = Join-Path $repoRoot $RelativePathFromRepoRoot

    if (-not (Test-Path -LiteralPath $fullPath)) {
        throw "Missing policy pack sample: $fullPath"
    }

    return (Get-Content -LiteralPath $fullPath -Raw)
}

function Get-ComplianceRuleKeysFromPackJson {
    param(
        [Parameter(Mandatory = $true)][string] $PackContentJson
    )

    $document = $PackContentJson | ConvertFrom-Json

    if ($null -eq $document -or ($document.PSObject.Properties.Name -notcontains 'complianceRuleKeys')) {
        return @()
    }

    return @($document.complianceRuleKeys | ForEach-Object { [string]$_ })
}

function Write-FindingDeltaReport {
    param(
        [Parameter(Mandatory = $true)][string] $PackLabel,
        [Parameter(Mandatory = $true)][string] $PackContentJson,
        [Parameter(Mandatory = $true)] $DryRunResponse
    )

    $ruleKeys = Get-ComplianceRuleKeysFromPackJson -PackContentJson $PackContentJson
    $ruleKeyCount = @($ruleKeys).Count

    Write-Host ''
    Write-Host "=== $PackLabel ===" -ForegroundColor Cyan
    Write-Host "  complianceRuleKeys in pack: $ruleKeyCount"

    if ($ruleKeyCount -gt 0) {
        $preview = @($ruleKeys | Select-Object -First 8) -join ', '

        if ($ruleKeyCount -gt 8) {
            $preview = "$preview, ..."
        }

        Write-Host "  sample keys: $preview"
    }

    if ($null -ne $DryRunResponse) {
        if ($DryRunResponse.PSObject.Properties.Name -contains 'gateResult') {
            Write-Host "  gateResult.blocked: $($DryRunResponse.gateResult.blocked)"
        }

        if ($DryRunResponse.PSObject.Properties.Name -contains 'selectedComplianceRuleIds') {
            $selected = @($DryRunResponse.selectedComplianceRuleIds)
            Write-Host "  selectedComplianceRuleIds: $($selected.Count)"
        }
    }
}

function Save-JsonArtifact {
    param(
        [Parameter(Mandatory = $true)][string] $FileName,
        [Parameter(Mandatory = $true)] $Object
    )

    $path = Join-Path $bundleDir $FileName
    $Object | ConvertTo-Json -Depth 30 | Set-Content -LiteralPath $path -Encoding UTF8
    Write-Host "Wrote $path"
}

Write-Host "Policy-pack delta demo — run $runIdNormalized" -ForegroundColor Cyan
Write-Host "Output: $bundleDir"

# Phase A — effective governance baseline
$effective = Invoke-ArchLucidJson -Method Get -RelativePath '/v1/policy-packs/effective'
Save-JsonArtifact -FileName 'phase-a-effective-governance.json' -Object $effective

# Resolve Security Architecture Baseline pack id when present
$packList = Invoke-ArchLucidJson -Method Get -RelativePath '/v1/policy-packs'
Save-JsonArtifact -FileName 'policy-packs-list.json' -Object $packList

$securityPackId = $null
$securityContentJson = $null

if ($null -ne $packList) {
    foreach ($pack in @($packList)) {
        if ($null -eq $pack) {
            continue
        }

        $displayName = ''

        if ($pack.PSObject.Properties.Name -contains 'displayName') {
            $displayName = [string]$pack.displayName
        }

        if ($displayName -match 'Security Architecture Baseline') {
            $securityPackId = [string]$pack.id
            break
        }
    }
}

if (-not [string]::IsNullOrWhiteSpace($securityPackId)) {
    $escapedPackId = [Uri]::EscapeDataString($securityPackId)
    $versions = Invoke-ArchLucidJson -Method Get -RelativePath "/v1/policy-packs/$escapedPackId/versions"

    if ($null -ne $versions -and @($versions).Count -gt 0) {
        $firstVersion = @($versions)[0]

        if ($null -ne $firstVersion -and ($firstVersion.PSObject.Properties.Name -contains 'contentJson')) {
            $securityContentJson = [string]$firstVersion.contentJson
        }
    }
}

if ([string]::IsNullOrWhiteSpace($securityContentJson)) {
    Write-Host 'WARN: Security Architecture Baseline content not resolved — using minimal dry-run body without pack JSON.' -ForegroundColor Yellow
    $securityContentJson = '{}'
}

# Phase B1 — baseline dry-run (no enforcement)
$baselineBody = @{
    targetRunId                 = $runIdNormalized
    policyPackContentJson       = $securityContentJson
    blockCommitOnCritical       = $false
    blockCommitMinimumSeverity  = $null
}
$baselineDryRun = Invoke-ArchLucidJson -Method Post -RelativePath '/v1/governance/policy-packs/dry-run' -Body $baselineBody
Save-JsonArtifact -FileName 'phase-b1-dry-run-baseline-allow.json' -Object $baselineDryRun

# Phase B2 — strict dry-run (Critical block)
$strictBody = @{
    targetRunId                 = $runIdNormalized
    policyPackContentJson       = $securityContentJson
    blockCommitOnCritical       = $true
    blockCommitMinimumSeverity  = $null
}
$strictDryRun = Invoke-ArchLucidJson -Method Post -RelativePath '/v1/governance/policy-packs/dry-run' -Body $strictBody
Save-JsonArtifact -FileName 'phase-b2-dry-run-strict-block.json' -Object $strictDryRun

# Phase B3 — pre-commit synthetic simulation
$simulateBody = @{
    runId             = $runIdNormalized
    syntheticSeverity = 'Critical'
    syntheticCount    = 1
}
$simulation = Invoke-ArchLucidJson -Method Post -RelativePath '/v1/governance/pre-commit/simulate' -Body $simulateBody
Save-JsonArtifact -FileName 'phase-b3-pre-commit-simulate-critical.json' -Object $simulation

# Phase C — pack-scoped dry-run when pack id known
if (-not [string]::IsNullOrWhiteSpace($securityPackId)) {
    $packDryRunBody = @{
        proposedThresholds       = @{ priorityFloor = 'P0' }
        evaluateAgainstRunIds    = @($runIdNormalized)
    }
    $escapedPackId = [Uri]::EscapeDataString($securityPackId)
    $packDryRun = Invoke-ArchLucidJson -Method Post -RelativePath "/v1/governance/policy-packs/$escapedPackId/dry-run" -Body $packDryRunBody
    Save-JsonArtifact -FileName 'phase-c-pack-dry-run-p0.json' -Object $packDryRun
}

# Phase D — audit CSV slice (best effort — requires RequireAuditor)
$auditCsvPath = Join-Path $bundleDir 'phase-d-audit-governance-events.csv'
$auditMetaPath = Join-Path $bundleDir 'phase-d-audit-export-meta.json'
$runIdForQuery = [Uri]::EscapeDataString($runIdNormalized)
$auditRelative = "/v1/audit/export/csv?runId=$runIdForQuery&maxRows=500"

try {
    $auditUri = "$normalizedBase$auditRelative"
    $auditReq = @{
        Uri             = $auditUri
        Method          = 'Get'
        UseBasicParsing = $true
        TimeoutSec      = 120
        OutFile         = $auditCsvPath
    }

    if ($headers.Count -gt 0) {
        $auditReq.Headers = $headers
    }

    Invoke-WebRequest @auditReq | Out-Null
    Write-Host "Wrote $auditCsvPath"

    Save-JsonArtifact -FileName 'phase-d-audit-export-meta.json' -Object @{
        status       = 'OK'
        relativePath = $auditRelative
        csvFile      = 'phase-d-audit-governance-events.csv'
        hint         = 'Filter rows for GovernancePreCommitSimulationEvaluated, GovernanceDryRunRequested, GovernancePreCommitBlocked, GovernancePreCommitWarned'
    }
}
catch {
    Save-JsonArtifact -FileName 'phase-d-audit-export-meta.json' -Object @{
        status       = 'SKIPPED'
        relativePath = $auditRelative
        error        = $_.Exception.Message
        hint         = 'Requires RequireAuditor policy or Development bypass; dry-run JSON artifacts still demonstrate gate delta.'
    }

    Write-Host "WARN: Audit CSV export skipped (auditor role may be required)." -ForegroundColor Yellow
}

$summary = @{
    runId              = $runIdNormalized
    bundleDir          = $bundleDir
    baselineBlocked    = $null
    strictBlocked      = $null
    simulationBlocked  = $null
    securityPackId     = $securityPackId
    doc                = 'docs/go-to-market/POLICY_PACK_DELTA_DEMO_SCRIPT.md'
}

if ($null -ne $baselineDryRun -and ($baselineDryRun.PSObject.Properties.Name -contains 'gateResult')) {
    $summary.baselineBlocked = [bool]$baselineDryRun.gateResult.blocked
}

if ($null -ne $strictDryRun -and ($strictDryRun.PSObject.Properties.Name -contains 'gateResult')) {
    $summary.strictBlocked = [bool]$strictDryRun.gateResult.blocked
}

if ($null -ne $simulation -and ($simulation.PSObject.Properties.Name -contains 'blocked')) {
    $summary.simulationBlocked = [bool]$simulation.blocked
}

Save-JsonArtifact -FileName 'summary.json' -Object $summary

# Phase E — before/after diff artifact (sales/demo bundle)
$beforeBlocked = $false
$afterBlocked = $false

if ($null -ne $baselineDryRun -and ($baselineDryRun.PSObject.Properties.Name -contains 'gateResult')) {
    $beforeBlocked = [bool]$baselineDryRun.gateResult.blocked
}

if ($null -ne $strictDryRun -and ($strictDryRun.PSObject.Properties.Name -contains 'gateResult')) {
    $afterBlocked = [bool]$strictDryRun.gateResult.blocked
}

$diffArtifact = @{
    demoLabel          = 'policy-pack-delta-demo (live API bundle)'
    runId              = $runIdNormalized
    before             = @{
        configurationLabel = 'Configuration A — baseline dry-run (allow path)'
        gateBlocked        = $beforeBlocked
        dryRunArtifact     = 'phase-b1-dry-run-baseline-allow.json'
    }
    after              = @{
        configurationLabel = 'Configuration B — strict dry-run (block path)'
        gateBlocked        = $afterBlocked
        dryRunArtifact     = 'phase-b2-dry-run-strict-block.json'
    }
    changes            = @{
        gateBlockedFlipped = ($beforeBlocked -ne $afterBlocked)
        SponsorReportLinesAdded = @(
            if ($afterBlocked -and -not $beforeBlocked) { 'Pre-commit gate: blocked (commit would not proceed)' }
        ) | Where-Object { $_ -ne $null }
        SponsorReportLinesRemoved = @(
            if ($beforeBlocked -and -not $afterBlocked) { 'Pre-commit gate: allowed (commit would proceed)' }
        ) | Where-Object { $_ -ne $null }
    }
    auditTrailCitations = @(
        @{
            eventType = 'GovernanceDryRunRequested'
            runId     = $runIdNormalized
            note      = 'Emitted by POST /v1/governance/policy-packs/dry-run for baseline and strict arms; filter phase-d-audit-governance-events.csv'
        }
    )
    canonicalFixture   = 'tests/fixtures/policy-ab-demo/policy-ab-demo-fixture.json'
    canonicalTest      = 'ArchLucid.Application.Tests.Governance.PolicyPackBeforeAfterDiffDemoTests'
}

Save-JsonArtifact -FileName 'policy-pack-before-after-diff.json' -Object $diffArtifact

$markdownLines = @(
    '# Policy pack before/after diff (live API bundle)',
    '',
    "- **Run id:** ``$runIdNormalized``",
    "- **Before gate blocked:** $beforeBlocked (see phase-b1-dry-run-baseline-allow.json)",
    "- **After gate blocked:** $afterBlocked (see phase-b2-dry-run-strict-block.json)",
    "- **Gate flipped:** $($beforeBlocked -ne $afterBlocked)",
    '',
    '## Audit trail',
    'Filter `phase-d-audit-governance-events.csv` for `GovernanceDryRunRequested` and, when assignments are persisted, `PolicyPackAssignmentCreated`.',
    '',
    '## Canonical synthetic fixture',
    'For deterministic CI regression and fully structured finding/rule/sponsor-report deltas, run `PolicyPackBeforeAfterDiffDemoTests` in ArchLucid.Application.Tests.'
)

$markdownPath = Join-Path $bundleDir 'policy-pack-before-after-diff.md'
$markdownLines | Set-Content -LiteralPath $markdownPath -Encoding UTF8
Write-Host "Wrote $markdownPath"

if ($ShowFindingDelta) {
    Write-Host ''
    Write-Host 'Finding-set toggle (compliance rule keys — same review, different packs)' -ForegroundColor Cyan

    $soc2PackJson = Read-PolicyPackContentJson -RelativePathFromRepoRoot 'docs/samples/policy-packs/soc2-tsc-architecture.json'
    $cisAzurePackJson = Read-PolicyPackContentJson -RelativePathFromRepoRoot 'docs/samples/policy-packs/cis-azure-foundations.json'

    $soc2DryRunBody = @{
        targetRunId                = $runIdNormalized
        policyPackContentJson      = $soc2PackJson
        blockCommitOnCritical      = $false
        blockCommitMinimumSeverity = $null
    }
    $cisDryRunBody = @{
        targetRunId                = $runIdNormalized
        policyPackContentJson      = $cisAzurePackJson
        blockCommitOnCritical      = $false
        blockCommitMinimumSeverity = $null
    }

    $soc2DryRun = Invoke-ArchLucidJson -Method Post -RelativePath '/v1/governance/policy-packs/dry-run' -Body $soc2DryRunBody
    $cisDryRun = Invoke-ArchLucidJson -Method Post -RelativePath '/v1/governance/policy-packs/dry-run' -Body $cisDryRunBody

    Save-JsonArtifact -FileName 'finding-delta-soc2-dry-run.json' -Object $soc2DryRun
    Save-JsonArtifact -FileName 'finding-delta-cis-azure-dry-run.json' -Object $cisDryRun

    $soc2Keys = Get-ComplianceRuleKeysFromPackJson -PackContentJson $soc2PackJson
    $cisKeys = Get-ComplianceRuleKeysFromPackJson -PackContentJson $cisAzurePackJson
    $onlySoc2 = @($soc2Keys | Where-Object { $cisKeys -notcontains $_ })
    $onlyCis = @($cisKeys | Where-Object { $soc2Keys -notcontains $_ })

    Write-FindingDeltaReport -PackLabel 'SOC 2 Type II (sample)' -PackContentJson $soc2PackJson -DryRunResponse $soc2DryRun
    Write-FindingDeltaReport -PackLabel 'CIS Azure Foundations (sample)' -PackContentJson $cisAzurePackJson -DryRunResponse $cisDryRun

    Write-Host ''
    Write-Host "  keys only in SOC 2 pack: $($onlySoc2.Count) (e.g. soc2-004 transport-security)"
    Write-Host "  keys only in CIS Azure pack: $($onlyCis.Count) (e.g. cis-az-006 public-access; includes identity topology extra in advisoryDefaults)"

    Save-JsonArtifact -FileName 'finding-delta-rule-key-sets.json' -Object @{
        runId              = $runIdNormalized
        soc2RuleKeyCount   = @($soc2Keys).Count
        cisAzureRuleKeyCount = @($cisKeys).Count
        onlyInSoc2         = $onlySoc2
        onlyInCisAzure     = $onlyCis
        offlineGoldenTests = @(
            'dotnet test ArchLucid.Decisioning.Tests --filter FullyQualifiedName~PolicyFilteredGoldenCorpusTests',
            'dotnet test ArchLucid.Decisioning.Tests --filter FullyQualifiedName~PolicyFilteredDeclarationGoldenCorpusTests',
            'dotnet test ArchLucid.Decisioning.Tests --filter FullyQualifiedName~PolicyExpectationCoverageGoldenCorpusTests'
        )
        honestyNote      = 'SOC 2 assignment alone does not add topology identity unless expectation.topologyCategories.add is stamped (see cis-azure-foundations.json).'
    }

    Write-Host ''
    Write-Host 'Offline declaration/topology proof (no live API persist):' -ForegroundColor Yellow
    Write-Host '  dotnet test ArchLucid.Decisioning.Tests --filter FullyQualifiedName~PolicyFilteredDeclarationGoldenCorpusTests'
    Write-Host '  dotnet test ArchLucid.Decisioning.Tests --filter FullyQualifiedName~PolicyExpectationCoverageGoldenCorpusTests'
}

Write-Host ''
Write-Host 'Delta demo complete.' -ForegroundColor Green
Write-Host "  Baseline dry-run blocked: $($summary.baselineBlocked)"
Write-Host "  Strict dry-run blocked:   $($summary.strictBlocked)"
Write-Host "  Simulation blocked:       $($summary.simulationBlocked)"
Write-Host "  See docs/go-to-market/POLICY_PACK_DELTA_DEMO_SCRIPT.md for talk track."
