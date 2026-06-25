#requires -Version 5.1

<#

.SYNOPSIS

  Verify demo workspace anchors before a live demo or sales call.



.DESCRIPTION

  Checks pinned demo workspace run ids from fixtures/demo-workspaces/demo-workspaces.fixture.manifest.json

  against the target API: committed review present, pilot-run-deltas, first-value report, traceability bundle,

  demo preview essentials (manifest, artifacts, runExplanation), and demo-derived ROI labeling.



  Emits PASS or HOLD with stable reason codes. Exit 0 = PASS, 2 = HOLD, 1 = script error.



.PARAMETER BaseUrl

  API root (defaults to ARCHLUCID_API_URL or http://localhost:5128).



.EXAMPLE

  ./verify-demo-workspace.ps1 -BaseUrl http://localhost:5128

#>

param(

    [string] $BaseUrl = '',

    [string] $BearerToken = '',

    [string] $ApiKey = '',

    [ValidateSet('A', 'B', 'Both')]

    [string] $Workspace = 'Both',

    [switch] $SkipPreview,

    [string] $JsonSummaryOut = ''

)



Set-StrictMode -Version Latest

$ErrorActionPreference = 'Stop'



. (Join-Path $PSScriptRoot 'ArchLucid.AuthHeaders.ps1')



if ([string]::IsNullOrWhiteSpace($BaseUrl)) {

    $BaseUrl = $env:ARCHLUCID_API_URL

}



if ([string]::IsNullOrWhiteSpace($BaseUrl)) {

    $BaseUrl = 'http://localhost:5128'

}



$repoRoot = Split-Path -Parent $PSScriptRoot

$manifestPath = Join-Path $repoRoot 'fixtures/demo-workspaces/demo-workspaces.fixture.manifest.json'

$previewValidator = Join-Path $PSScriptRoot 'demo_preview_essentials.py'



if (-not (Test-Path -LiteralPath $manifestPath)) {

    throw "Missing demo workspace manifest: $manifestPath"

}



$manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json

$fixturePackageVersion = [string]$manifest.fixturePackageVersion

if ([string]::IsNullOrWhiteSpace($fixturePackageVersion)) {
    Add-HoldReason -Code 'demo-workspace-manifest-missing-version'
}

foreach ($workspaceKey in @('workspaceA', 'workspaceB')) {
    $manifestWorkspace = $manifest.$workspaceKey

    if ($null -eq $manifestWorkspace) {
        Add-HoldReason -Code "demo-workspace-manifest-missing-$workspaceKey"
        continue
    }

    if ($null -eq $manifestWorkspace.expectedCommittedFindingCount) {
        Add-HoldReason -Code "demo-workspace-manifest-missing-finding-count-$workspaceKey"
    }
}

$normalizedBase = $BaseUrl.Trim().TrimEnd('/')

$headers = Get-ArchLucidHttpAuthHeadersHashtable -BearerToken $BearerToken -ApiKey $ApiKey

$checks = [System.Collections.Generic.List[string]]::new()

$holdReasons = [System.Collections.Generic.List[string]]::new()

$script:demoScopeHeadersAccepted = $true



function Add-HoldReason {

    param([Parameter(Mandatory = $true)][string] $Code)



    if (-not $script:holdReasons.Contains($Code)) {

        $script:holdReasons.Add($Code)

    }

}



function Test-DemoScopeHeadersAccepted {
    param(
        [Parameter(Mandatory = $true)][string] $TenantId,
        [Parameter(Mandatory = $true)][string] $WorkspaceId,
        [Parameter(Mandatory = $true)][string] $ProjectId,
        [Parameter(Mandatory = $true)][string] $RunId
    )

    $scopeHeaders = Merge-ArchLucidHttpScopeHeaders -Headers $headers -TenantId $TenantId -WorkspaceId $WorkspaceId -ProjectId $ProjectId
    $uri = "$normalizedBase/v1/pilots/runs/$([Uri]::EscapeDataString($RunId))/pilot-run-deltas"

    try {
        $null = Invoke-WebRequest -Uri $uri -Method Get -UseBasicParsing -TimeoutSec 15 -Headers $scopeHeaders
        return $true
    }
    catch {
        $message = $_.Exception.Message

        if ($null -ne $_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $body = $reader.ReadToEnd()

            if (-not [string]::IsNullOrWhiteSpace($body)) {
                $message = $body
            }
        }

        if ($message -match 'Scope header ''x-workspace-id'' does not match' -or $message -match 'Scope header ''X-Workspace-Id'' does not match') {
            return $false
        }

        return $true
    }
}



function Test-DemoRun {

    param(

        [Parameter(Mandatory = $true)][string] $Label,

        [Parameter(Mandatory = $true)][string] $RunId,

        [Parameter(Mandatory = $true)][int] $ExpectedFindingCount,

        [Parameter(Mandatory = $true)][string] $TenantId,

        [Parameter(Mandatory = $true)][string] $WorkspaceId,

        [Parameter(Mandatory = $true)][string] $ProjectId

    )



    $scopeHeaders = Merge-ArchLucidHttpScopeHeaders -Headers $headers -TenantId $TenantId -WorkspaceId $WorkspaceId -ProjectId $ProjectId



    function Invoke-Probe {

        param([string] $RelativePath)



        $uri = "$normalizedBase$RelativePath"

        $req = @{

            Uri             = $uri

            Method          = 'Get'

            UseBasicParsing = $true

            TimeoutSec      = 15

        }



        if ($scopeHeaders.Count -gt 0) {

            $req.Headers = $scopeHeaders

        }



        return Invoke-WebRequest @req

    }



    try {

        $deltas = Invoke-Probe -RelativePath "/v1/pilots/runs/$([Uri]::EscapeDataString($RunId))/pilot-run-deltas"

        $deltasObj = $deltas.Content | ConvertFrom-Json



        if (-not $deltasObj.proofPackageCompleteness.committedManifestPresent) {

            throw 'demo-workspace-committed-manifest-missing'

        }



        $severityTotal = 0



        if ($null -ne $deltasObj.findingsBySeverity) {

            foreach ($row in $deltasObj.findingsBySeverity) {

                $severityTotal += [int]$row.count

            }

        }



        if ($severityTotal -lt $ExpectedFindingCount) {

            throw "demo-workspace-finding-count-low expected=$ExpectedFindingCount actual=$severityTotal"

        }



        $firstValue = Invoke-Probe -RelativePath "/v1/pilots/runs/$([Uri]::EscapeDataString($RunId))/first-value-report"

        $firstValueText = [string]$firstValue.Content



        if ($firstValueText -notmatch '(?i)demo[- ]derived|Demo-derived') {

            throw 'demo-workspace-first-value-missing-demo-derived-label'

        }



        Invoke-Probe -RelativePath "/v1/architecture/run/$([Uri]::EscapeDataString($RunId))/traceability-bundle.zip" | Out-Null



        $script:checks.Add("| $Label | PASS | runId=$RunId findings=$severityTotal |")

    }

    catch {

        $detail = ($_.Exception.Message -replace '\r?\n', ' ')

        Add-HoldReason -Code $detail

        $script:checks.Add("| $Label | HOLD | $detail |")

    }

}



function Test-DemoPreview {

    $previewPath = Join-Path $env:TEMP ("archlucid-demo-preview-" + [Guid]::NewGuid().ToString('N') + '.json')



    try {

        $uri = "$normalizedBase/v1/demo/preview"

        $response = Invoke-WebRequest -Uri $uri -Method Get -UseBasicParsing -TimeoutSec 15

        [System.IO.File]::WriteAllText($previewPath, $response.Content, [System.Text.UTF8Encoding]::new($false))

        $validationOutput = & python $previewValidator --validate-file $previewPath 2>&1

        if ($null -eq $validationOutput) {

            $validationOutput = @()

        }

        $validationExit = $LASTEXITCODE

        $validationText = ($validationOutput | Out-String).Trim()



        if ($validationExit -eq 0) {

            $script:checks.Add('| Demo preview essentials | PASS | manifest, artifacts, runExplanation present |')

            return

        }



        if ($validationExit -eq 2) {

            foreach ($line in ($validationText -split "`n")) {

                if ($line -match '^\s*-\s*(.+)$') {

                    Add-HoldReason -Code $Matches[1].Trim()

                }

            }



            $script:checks.Add("| Demo preview essentials | HOLD | see disposition reasons |")

            return

        }



        throw $validationText

    }

    catch {

        $detail = ($_.Exception.Message -replace '\r?\n', ' ')

        Add-HoldReason -Code 'demo-preview-request-failed'

        $script:checks.Add("| Demo preview essentials | HOLD | $detail |")

    }

    finally {

        if (Test-Path -LiteralPath $previewPath) {

            Remove-Item -LiteralPath $previewPath -Force -ErrorAction SilentlyContinue

        }

    }

}



if ($Workspace -eq 'A' -or $Workspace -eq 'Both') {
    $script:demoScopeHeadersAccepted = Test-DemoScopeHeadersAccepted `
        -TenantId ([string]$manifest.defaultTenantId) `
        -WorkspaceId ([string]$manifest.workspaceA.workspaceId) `
        -ProjectId ([string]$manifest.workspaceA.projectId) `
        -RunId ([string]$manifest.workspaceA.runId)
}

if (-not $script:demoScopeHeadersAccepted) {
    Add-HoldReason -Code 'demo-workspace-scope-headers-unavailable'
    $checks.Add('| Workspace scope headers | HOLD | Enable ArchLucidAuth:AllowTestActorHeaders on Development hosts or set demo workspace scope in the API shell. |')
}
else {
    if ($Workspace -eq 'A' -or $Workspace -eq 'Both') {

        Test-DemoRun -Label 'Workspace A (product-tour)' `

            -RunId $manifest.workspaceA.runId `

            -ExpectedFindingCount ([int]$manifest.workspaceA.expectedCommittedFindingCount) `

            -TenantId ([string]$manifest.defaultTenantId) `

            -WorkspaceId ([string]$manifest.workspaceA.workspaceId) `

            -ProjectId ([string]$manifest.workspaceA.projectId)

    }



    if ($Workspace -eq 'B' -or $Workspace -eq 'Both') {

        Test-DemoRun -Label 'Workspace B (regulated-scenario)' `

            -RunId $manifest.workspaceB.runId `

            -ExpectedFindingCount ([int]$manifest.workspaceB.expectedCommittedFindingCount) `

            -TenantId ([string]$manifest.defaultTenantId) `

            -WorkspaceId ([string]$manifest.workspaceB.workspaceId) `

            -ProjectId ([string]$manifest.workspaceB.projectId)

    }
}



if (-not $SkipPreview) {

    Test-DemoPreview

}



$disposition = if ($holdReasons.Count -eq 0) { 'PASS' } else { 'HOLD' }



Write-Host ''

Write-Host '=== Demo workspace verification ===' -ForegroundColor Cyan

Write-Host "Base URL: $normalizedBase"

Write-Host "Fixture package: $fixturePackageVersion"

Write-Host "Demo workspace disposition: $disposition"

Write-Host ''



if ($holdReasons.Count -gt 0) {

    Write-Host 'Reasons:'



    foreach ($reason in $holdReasons) {

        Write-Host "  - $reason"

    }



    Write-Host ''

}



Write-Host '| Check | Result | Detail |'

Write-Host '| --- | --- | --- |'

$checks | ForEach-Object { Write-Host $_ }

Write-Host ''



if (-not [string]::IsNullOrWhiteSpace($JsonSummaryOut)) {
    $summaryPayload = [ordered]@{
        disposition           = $disposition
        holdReasons           = @($holdReasons)
        fixturePackageVersion = $fixturePackageVersion
        manifestPath          = 'fixtures/demo-workspaces/demo-workspaces.fixture.manifest.json'
        checks                = @($checks)
    }

    $summaryJson = $summaryPayload | ConvertTo-Json -Depth 6
    [System.IO.File]::WriteAllText($JsonSummaryOut, $summaryJson, [System.Text.UTF8Encoding]::new($false))
}



if ($disposition -eq 'PASS') {

    Write-Host 'PASS - demo workspaces ready for a buyer-safe preview or live demo.' -ForegroundColor Green

    exit 0

}



Write-Host 'HOLD - demo prerequisites incomplete. See docs/go-to-market/DEMO_WORKSPACES.md' -ForegroundColor Yellow

exit 2

