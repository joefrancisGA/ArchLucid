#Requires -Version 5.1
<#
.SYNOPSIS
  Prints real-mode LLM CI / golden-cohort prerequisite status (names only — never secret values).

.DESCRIPTION
  Improvement #20 / TB-007 Gap A+C operator checklist. Inspects process environment variables
  (and optional GitHub CLI repository metadata when `gh` is authenticated) to explain why
  Tier 2d live AOAI or golden-cohort jobs are skipped.

  Does not print secret values. Exit 0 when informational checks complete; exit 1 with -Strict
  when any required item for the selected profile is missing.
#>
[CmdletBinding()]
param(
    [ValidateSet('CiLiveAoai', 'GoldenCohortGate', 'RealLlmEvidence', 'All')]
    [string]$Profile = 'All',

    [switch]$Strict,

    [switch]$UseGitHubCli
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Test-EnvPresent {
    param([string]$Name)

    $value = [Environment]::GetEnvironmentVariable($Name)

    return -not [string]::IsNullOrWhiteSpace($value)
}

function Test-GhNameListed {
    param(
        [string]$Kind,
        [string]$Name
    )

    try {
        if ($Kind -eq 'var') {
            $ghValue = gh variable get $Name 2>$null

            return -not [string]::IsNullOrWhiteSpace($ghValue)
        }

        $repoListed = gh secret list 2>$null | Select-String -SimpleMatch $Name

        if ($null -ne $repoListed) {
            return $true
        }

        $envListed = gh secret list --env dev 2>$null | Select-String -SimpleMatch $Name

        return ($null -ne $envListed)
    }
    catch {
        return $false
    }
}

function Test-RealLlmCredentialGroupPresent {
    param([switch]$UseGh)

    $pairs = @(
        @('ARCHLUCID_REAL_AOAI_TEST_ENDPOINT', 'ARCHLUCID_REAL_AOAI_TEST_KEY'),
        @('AZURE_OPENAI_ENDPOINT', 'AZURE_OPENAI_API_KEY'),
        @('ARCHLUCID_CI_REAL_AOAI_ENDPOINT', 'ARCHLUCID_CI_REAL_AOAI_KEY')
    )

    foreach ($pair in $pairs) {
        $endpointPresent = Test-EnvPresent -Name $pair[0]
        $keyPresent = Test-EnvPresent -Name $pair[1]

        if ($UseGh) {
            if (-not $endpointPresent) {
                $endpointPresent = Test-GhNameListed -Kind 'secret' -Name $pair[0]
            }

            if (-not $keyPresent) {
                $keyPresent = Test-GhNameListed -Kind 'secret' -Name $pair[1]
            }
        }

        if ($endpointPresent -and $keyPresent) {
            return $true
        }
    }

    return $false
}

function Write-PrereqLine {
    param(
        [string]$Kind,
        [string]$Name,
        [string]$Purpose,
        [bool]$Present
    )

    $status = if ($Present) { 'present' } else { 'MISSING' }

    Write-Host ("[{0}] {1,-45} {2,-8} - {3}" -f $Kind, $Name, $status, $Purpose)
}

$ciLiveAoai = @(
    @{ Kind = 'var';   Name = 'ARCHLUCID_CI_REAL_AOAI_ENABLED';     Purpose = 'Must be true for ci.yml job dotnet-azure-openai-live-post-regression' }
    @{ Kind = 'secret'; Name = 'ARCHLUCID_CI_REAL_AOAI_ENDPOINT';    Purpose = 'Azure OpenAI HTTPS endpoint for RealAzureOpenAIEndToEndTests' }
    @{ Kind = 'secret'; Name = 'ARCHLUCID_CI_REAL_AOAI_KEY';         Purpose = 'Azure OpenAI API key for RealAzureOpenAIEndToEndTests' }
    @{ Kind = 'var';   Name = 'ARCHLUCID_CI_REAL_AOAI_DEPLOYMENT';   Purpose = 'Deployment name (optional; tests may default when unset)' }
)

$goldenCohort = @(
    @{ Kind = 'var';   Name = 'ARCHLUCID_GOLDEN_COHORT_BASELINE_LOCKED'; Purpose = 'Must be true for golden-cohort-nightly.yml baseline drift job' }
    @{ Kind = 'var';   Name = 'ARCHLUCID_GOLDEN_COHORT_REAL_LLM';         Purpose = 'Must be true for cohort-real-llm-gate / live invoke paths' }
    @{ Kind = 'secret'; Name = 'ARCHLUCID_GOLDEN_COHORT_API_HOST';         Purpose = 'API base URL for live cohort drift (ARCHLUCID_API_URL)' }
    @{ Kind = 'secret'; Name = 'ARCHLUCID_GOLDEN_COHORT_AZURE_OPENAI_RESOURCE_ID'; Purpose = 'Cost Management probe resource id for budget kill-switch (optional until live gate enabled on schedule)' }
    @{ Kind = 'secret'; Name = 'AZURE_OPENAI_API_KEY';                     Purpose = 'Runner-side key for cohort-real-llm-live drift step' }
    @{ Kind = 'var';   Name = 'AZURE_OPENAI_ENDPOINT';                      Purpose = 'Runner-side endpoint for cohort-real-llm-live drift step' }
    @{ Kind = 'var';   Name = 'ARCHLUCID_GOLDEN_COHORT_LIVE_SCHEDULE_ENABLED'; Purpose = 'Optional; true enables Sunday 06:00 UTC unattended live invoke' }
)

# TB-138 / real-llm-golden-cohort.yml — any one credential pair satisfies RealLlmEvidence.
$realLlmEvidence = @(
    @{ Kind = 'secret'; Name = 'ARCHLUCID_REAL_AOAI_TEST_ENDPOINT'; Purpose = 'Preferred endpoint for scripts/Invoke-RealLlmEvidenceGate.ps1' }
    @{ Kind = 'secret'; Name = 'ARCHLUCID_REAL_AOAI_TEST_KEY';      Purpose = 'Preferred API key for real-LLM evidence gate' }
    @{ Kind = 'secret'; Name = 'AZURE_OPENAI_ENDPOINT';            Purpose = 'Fallback endpoint mapped by Invoke-RealLlmGoldenCohort.ps1' }
    @{ Kind = 'secret'; Name = 'AZURE_OPENAI_API_KEY';             Purpose = 'Fallback API key mapped by Invoke-RealLlmGoldenCohort.ps1' }
    @{ Kind = 'secret'; Name = 'ARCHLUCID_CI_REAL_AOAI_ENDPOINT';  Purpose = 'CI Tier 2d endpoint mapped by Invoke-RealLlmGoldenCohort.ps1' }
    @{ Kind = 'secret'; Name = 'ARCHLUCID_CI_REAL_AOAI_KEY';       Purpose = 'CI Tier 2d API key mapped by Invoke-RealLlmGoldenCohort.ps1' }
)

$selected = @()

if ($Profile -eq 'CiLiveAoai' -or $Profile -eq 'All') {
    $selected += $ciLiveAoai
}

if ($Profile -eq 'GoldenCohortGate' -or $Profile -eq 'All') {
    $selected += $goldenCohort
}

if ($Profile -eq 'RealLlmEvidence' -or $Profile -eq 'All') {
    $selected += $realLlmEvidence
}

Write-Host ''
Write-Host 'ArchLucid real-mode LLM prerequisite report (values never printed)'
Write-Host "Profile: $Profile"
Write-Host ''

$missingRequired = 0
$realLlmCredentialGroupPresent = $false

if ($Profile -eq 'RealLlmEvidence' -or $Profile -eq 'All') {
    $realLlmCredentialGroupPresent = Test-RealLlmCredentialGroupPresent -UseGh:$UseGitHubCli
}

foreach ($item in $selected) {
    $present = Test-EnvPresent -Name $item.Name

    if ($UseGitHubCli -and -not $present) {
        $present = Test-GhNameListed -Kind $item.Kind -Name $item.Name
    }

    Write-PrereqLine -Kind $item.Kind -Name $item.Name -Purpose $item.Purpose -Present:$present

    $optional = @(
        'ARCHLUCID_CI_REAL_AOAI_DEPLOYMENT',
        'ARCHLUCID_GOLDEN_COHORT_LIVE_SCHEDULE_ENABLED',
        'ARCHLUCID_GOLDEN_COHORT_API_HOST',
        'ARCHLUCID_GOLDEN_COHORT_AZURE_OPENAI_RESOURCE_ID',
        'AZURE_OPENAI_ENDPOINT',
        'AZURE_OPENAI_API_KEY',
        'ARCHLUCID_REAL_AOAI_TEST_ENDPOINT',
        'ARCHLUCID_REAL_AOAI_TEST_KEY',
        'ARCHLUCID_CI_REAL_AOAI_ENDPOINT',
        'ARCHLUCID_CI_REAL_AOAI_KEY'
    )

    if (-not $present -and $optional -notcontains $item.Name) {
        $missingRequired++
    }
}

if (($Profile -eq 'RealLlmEvidence' -or $Profile -eq 'All') -and -not $realLlmCredentialGroupPresent) {
    $missingRequired++
    Write-Host ''
    Write-Host '[group] RealLlmEvidence credential pair (any one)          MISSING  - Need endpoint+key from REAL_AOAI_TEST, AZURE_OPENAI, or CI_REAL_AOAI secrets'
}

Write-Host ''
Write-Host 'When jobs are skipped:'
Write-Host '  - ci.yml Tier 2d (RealAzureOpenAIEndToEndTests): ARCHLUCID_CI_REAL_AOAI_ENABLED != true, or event is pull_request, or AOAI secrets missing.'
Write-Host '  - golden-cohort-nightly cohort-real-llm-gate: ARCHLUCID_GOLDEN_COHORT_REAL_LLM != true or baseline not locked.'
Write-Host '  - real-llm-golden-cohort.yml: no REAL_AOAI_TEST / AZURE_OPENAI / CI_REAL_AOAI credential pair (skip-graceful exit 0).'
Write-Host '  - Budget kill-switch exit 2: MTD spend >= 95% of tests/golden-cohort/budget.config.json cap - see docs/runbooks/GOLDEN_COHORT_REAL_LLM_GATE.md'
Write-Host ''
Write-Host 'Owner-only TB-138 promotion (after one green run): add required check cohort-real-llm-gate in GitHub branch protection; optionally inject RealLlmEvidence secrets above.'
Write-Host ''
Write-Host 'Docs: docs/engineering/BUILD.md (Real-mode LLM CI), docs/runbooks/GOLDEN_COHORT_REAL_LLM_GATE.md, docs/library/TECH_BACKLOG.md TB-007 / TB-138'
Write-Host ''

if ($Strict -and $missingRequired -gt 0) {
    Write-Error "Strict mode: $missingRequired required prerequisite name(s) missing for profile $Profile."

    exit 1
}

exit 0
