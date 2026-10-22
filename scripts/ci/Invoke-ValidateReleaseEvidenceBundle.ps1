<#
    .SYNOPSIS
        Validates a release evidence folder against the canonical bundle profile (T2-10).

    .PARAMETER BundleDir
        Evidence folder root (for example artifacts/release-readiness).

    .PARAMETER Profile
        Profile id from scripts/ci/data/release_evidence_bundle_profiles.v1.json.

    .PARAMETER JsonOut
        Optional path for validation report JSON.

    .PARAMETER StrictBuyerRc
        Require buyer-facing RC packet artifacts and strict machine-readable signoff outputs.

    .EXAMPLE
        .\scripts\ci\Invoke-ValidateReleaseEvidenceBundle.ps1 -BundleDir artifacts/release-readiness -Profile release-readiness -StrictBuyerRc
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string] $BundleDir,

    [Parameter(Mandatory = $true)]
    [string] $Profile,

    [string] $JsonOut = '',

    [switch] $StrictBuyerRc
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$pythonScript = Join-Path $PSScriptRoot 'release_evidence_bundle.py'

[string[]] $pythonArgs = @(
    $pythonScript,
    'validate',
    '--dir', $BundleDir,
    '--profile', $Profile
)

if (-not [string]::IsNullOrWhiteSpace($JsonOut)) {
    $pythonArgs += @('--json-out', $JsonOut)
}

if ($StrictBuyerRc) {
    $pythonArgs += '--strict-buyer-rc'
}

& python @pythonArgs
exit $LASTEXITCODE
