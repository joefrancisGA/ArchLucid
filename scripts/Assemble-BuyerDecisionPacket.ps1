#requires -Version 5.1
<#
.SYNOPSIS
  Assemble buyer-facing decision packet folder from existing proof and release artifacts.

.DESCRIPTION
  Copies required artifacts into one export directory with index.md and manifest.json.
  Does not invent new scoring — only aggregates pass/fail indicators from source files.
#>
param(
    [Parameter(Mandatory = $true)]
    [string] $ProofDirectory,
    [string] $OutputDirectory = '',
    [string] $ReleaseBundleDirectory = '',
    [switch] $FailOnMissing
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$proofDir = (Resolve-Path -LiteralPath $ProofDirectory).Path

if ([string]::IsNullOrWhiteSpace($OutputDirectory)) {
    $stamp = [DateTime]::UtcNow.ToString('yyyyMMddHHmmss', [System.Globalization.CultureInfo]::InvariantCulture)
    $OutputDirectory = Join-Path $root "artifacts\buyer-decision-packet\$stamp"
}

$outDir = $OutputDirectory
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

$requiredProof = @(
    'go-no-go-summary.json',
    'first-pilot-command-center.md',
    'commercial-closeout.json',
    'roi-baseline-send-evaluation.json'
)

$optionalProof = @(
    'quote-to-proof-packet.md',
    'ai-readiness-gate.json',
    'first-pilot-evidence/first-value-report.md'
)

$optionalRelease = @(
    'rc-go-no-go-verdict.json',
    'observability-export-readiness.md',
    'route-tier-policy-nav-parity.json'
)

$entries = [System.Collections.Generic.List[object]]::new()
$missingRequired = [System.Collections.Generic.List[string]]::new()
$unsafeMarkerHits = [System.Collections.Generic.List[string]]::new()

$unsafeMarkerPatterns = @(
    '\[TODO\b',
    '\bFIXME\b',
    'localhost:',
    '127\.0\.0\.1',
    '<your-',
    'example\.com/checkout'
)

function Test-BuyerUnsafeMarkers {
    param(
        [string] $FilePath
    )

    if (-not (Test-Path -LiteralPath $FilePath)) {
        return
    }

    [string] $extension = [System.IO.Path]::GetExtension($FilePath)

    if ($extension -notin @('.md', '.txt')) {
        return
    }

    [string] $text = Get-Content -LiteralPath $FilePath -Raw

    foreach ($pattern in $unsafeMarkerPatterns) {
        if ($text -match $pattern) {
            [void]$unsafeMarkerHits.Add("$FilePath matches $pattern")
        }
    }
}

function Add-PacketEntry {
    param(
        [string] $SourcePath,
        [string] $Category,
        [bool] $Required
    )

    $relative = $SourcePath
    $destName = Split-Path -Leaf $SourcePath
    $destPath = Join-Path $outDir $destName

    if (-not (Test-Path -LiteralPath $SourcePath)) {
        if ($Required) {
            [void]$missingRequired.Add($relative)
        }

        [void]$entries.Add([ordered]@{
                name       = $destName
                sourcePath = $relative
                category   = $Category
                required   = $Required
                present    = $false
                disposition = 'MISSING'
            })

        return
    }

    Copy-Item -LiteralPath $SourcePath -Destination $destPath -Force
    Test-BuyerUnsafeMarkers -FilePath $destPath

    $disposition = 'PASS'

    if ($destName.EndsWith('.json')) {
        try {
            $payload = Get-Content -LiteralPath $SourcePath -Raw | ConvertFrom-Json -ErrorAction Stop

            if ($null -ne $payload.verdict) {
                $disposition = [string]$payload.verdict
            }
            elseif ($null -ne $payload.sponsorPacketDisposition) {
                $disposition = [string]$payload.sponsorPacketDisposition
            }
            elseif ($null -ne $payload.sendEligible -and -not [bool]$payload.sendEligible) {
                $disposition = 'HOLD'
            }
            elseif ($null -ne $payload.disposition) {
                $disposition = [string]$payload.disposition
            }
        }
        catch {
            $disposition = 'WARN'
        }
    }

    [void]$entries.Add([ordered]@{
            name        = $destName
            sourcePath  = $relative
            category    = $Category
            required    = $Required
            present     = $true
            disposition = $disposition
        })
}

foreach ($name in $requiredProof) {
    Add-PacketEntry -SourcePath (Join-Path $proofDir $name) -Category 'proof' -Required $true
}

foreach ($name in $optionalProof) {
    Add-PacketEntry -SourcePath (Join-Path $proofDir $name) -Category 'proof' -Required $false
}

if (-not [string]::IsNullOrWhiteSpace($ReleaseBundleDirectory) -and (Test-Path -LiteralPath $ReleaseBundleDirectory)) {
    $releaseDir = (Resolve-Path -LiteralPath $ReleaseBundleDirectory).Path

    foreach ($name in $optionalRelease) {
        Add-PacketEntry -SourcePath (Join-Path $releaseDir $name) -Category 'release' -Required $false
    }
}

$generatedUtc = [DateTime]::UtcNow.ToString('o', [System.Globalization.CultureInfo]::InvariantCulture)
$overall = if ($missingRequired.Count -gt 0 -or $unsafeMarkerHits.Count -gt 0) { 'HOLD' } else { 'PASS' }

$manifest = [ordered]@{
    schema       = 'archlucid.buyer-decision-packet.v1'
    generatedUtc = $generatedUtc
    proofDirectory = $proofDir
    outputDirectory = $outDir
    overallDisposition = $overall
    missingRequired = @($missingRequired)
    unsafeMarkerHits = @($unsafeMarkerHits)
    entries      = @($entries)
}

$manifestPath = Join-Path $outDir 'pack-manifest.json'
$manifest | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $manifestPath -Encoding UTF8

$indexLines = [System.Collections.Generic.List[string]]::new()
$indexLines.Add('# Buyer decision packet')
$indexLines.Add('')
$indexLines.Add("Generated UTC: **$generatedUtc**")
$indexLines.Add('')
$indexLines.Add("| Overall | **$overall** |")
$indexLines.Add('')

if ($unsafeMarkerHits.Count -gt 0) {
    $indexLines.Add('## Unsafe marker hits')
    $indexLines.Add('')

    foreach ($hit in $unsafeMarkerHits) {
        $indexLines.Add("- $hit")
    }

    $indexLines.Add('')
}

$indexLines.Add('| Artifact | Required | Present | Disposition |')
$indexLines.Add('| --- | --- | --- | --- |')

foreach ($entry in $entries) {
    $indexLines.Add("| $($entry.name) | $($entry.required) | $($entry.present) | $($entry.disposition) |")
}

$indexLines.Add('')
$indexLines.Add('## Command')
$indexLines.Add('')
$indexLines.Add('```powershell')
$indexLines.Add(".\\scripts\\Assemble-BuyerDecisionPacket.ps1 -ProofDirectory '$proofDir' -FailOnMissing")
$indexLines.Add('```')
$indexLines | Set-Content -LiteralPath (Join-Path $outDir 'index.md') -Encoding UTF8

Write-Host "Wrote buyer decision packet: $outDir"
Write-Host "Overall disposition: $overall"

if ($FailOnMissing -and $missingRequired.Count -gt 0) {
    Write-Host "Missing required artifacts: $($missingRequired -join ', ')"
    exit 1
}

if ($unsafeMarkerHits.Count -gt 0) {
    Write-Host "Unsafe buyer markers detected:"
    foreach ($hit in $unsafeMarkerHits) {
        Write-Host "  - $hit"
    }

    exit 1
}

if ($overall -eq 'HOLD') {
    exit 1
}

exit 0
