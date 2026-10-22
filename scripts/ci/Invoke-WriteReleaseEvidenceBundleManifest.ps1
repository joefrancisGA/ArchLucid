<#
    .SYNOPSIS
        Emits release-evidence-bundle-manifest.json for a profile (T2-10).

    .PARAMETER BundleDir
        Evidence folder root.

    .PARAMETER Profile
        Profile id (release-readiness, production-readiness-drill, staging-readiness).

    .PARAMETER Rollup
        PASS, WARN, FAIL, HOLD, or UNKNOWN.

    .EXAMPLE
        .\scripts\ci\Invoke-WriteReleaseEvidenceBundleManifest.ps1 -BundleDir artifacts/release-readiness -Profile release-readiness -Rollup PASS
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string] $BundleDir,

    [Parameter(Mandatory = $true)]
    [string] $Profile,

    [string] $Rollup = 'UNKNOWN',

    [string] $GitCommitSha = 'unknown',

    [string] $CliVersion = 'unknown',

    [string] $Environment = ''
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$pythonScript = Join-Path $PSScriptRoot 'release_evidence_bundle.py'

[string[]] $pythonArgs = @(
    $pythonScript,
    'emit',
    '--dir', $BundleDir,
    '--profile', $Profile,
    '--rollup', $Rollup,
    '--git-commit-sha', $GitCommitSha,
    '--cli-version', $CliVersion
)

if (-not [string]::IsNullOrWhiteSpace($Environment)) {
    $pythonArgs += @('--environment', $Environment)
}

& python @pythonArgs
exit $LASTEXITCODE
