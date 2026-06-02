#!/usr/bin/env pwsh
<#
.SYNOPSIS
  Pre-deploy pilot prerequisites check — local config + repo layout; no Azure login required.

.DESCRIPTION
  Validates minimum configuration keys and repo artifacts for FirstPilotMinimum, StagingRealLlm,
  or ProductionLike profiles. ProductionLike BLOCKs when Azure AI Search vector index/endpoint
  are not configured (owner 2026-05-29 production-like requirement).

.PARAMETER Profile
  FirstPilotMinimum | StagingRealLlm | ProductionLike

.PARAMETER MarkdownOut
  Report path (default: artifacts/pilot/prerequisites-<profile>.md).

.PARAMETER JsonOut
  JSON report path (default: artifacts/pilot/prerequisites-<profile>.json).
#>
[CmdletBinding()]
param(
    [ValidateSet("FirstPilotMinimum", "StagingRealLlm", "ProductionLike")]
    [string] $Profile = "FirstPilotMinimum",

    [string] $MarkdownOut = "",

    [string] $JsonOut = ""
)

$ErrorActionPreference = "Stop"
[string] $root = Split-Path -Parent $PSScriptRoot
Set-Location $root

if ([string]::IsNullOrWhiteSpace($MarkdownOut)) {
    $MarkdownOut = "artifacts/pilot/prerequisites-$Profile.md"
}

if ([string]::IsNullOrWhiteSpace($JsonOut)) {
    $JsonOut = "artifacts/pilot/prerequisites-$Profile.json"
}

function Add-Check {
    param([string]$Name, [string]$Verdict, [string]$Detail)
    return [ordered]@{ name = $Name; verdict = $Verdict; detail = $Detail }
}

function Read-RepoText {
    param([string]$Rel)
    [string] $abs = Join-Path $root $Rel

    if (!(Test-Path -LiteralPath $abs -PathType Leaf)) {
        return $null
    }

    return Get-Content -LiteralPath $abs -Raw
}

function Get-ConfigValue {
    param([string]$ColonPath)

    [string] $envName = ($ColonPath -replace ':', '__')
    [string] $envVal = [Environment]::GetEnvironmentVariable($envName)

    if (-not [string]::IsNullOrWhiteSpace($envVal)) {
        return $envVal.Trim()
    }

    return $script:MergedConfig[$ColonPath]
}

function Merge-HashtableDeep {
    param(
        [hashtable] $Base,
        [hashtable] $Override
    )

    [hashtable] $result = @{}

    foreach ($key in $Base.Keys) {
        $result[$key] = $Base[$key]
    }

    foreach ($key in $Override.Keys) {
        [object] $prev = $null

        if ($result.ContainsKey($key)) {
            $prev = $result[$key]
        }

        if (($prev -is [hashtable]) -and ($Override[$key] -is [hashtable])) {
            $result[$key] = Merge-HashtableDeep -Base $prev -Override $Override[$key]
        }
        else {
            $result[$key] = $Override[$key]
        }
    }

    return $result
}

function Flatten-ConfigHashtable {
    param(
        [hashtable] $Node,
        [string] $Prefix = ""
    )

    foreach ($key in $Node.Keys) {
        [string] $path = if ([string]::IsNullOrWhiteSpace($Prefix)) { $key } else { "$Prefix`:$key" }
        [object] $val = $Node[$key]

        if ($val -is [hashtable]) {
            Flatten-ConfigHashtable -Node $val -Prefix $path
        }
        elseif ($null -ne $val -and "$val".Trim().Length -gt 0) {
            $script:MergedConfig[$path] = "$val".Trim()
        }
    }
}

function ConvertTo-HashtableDeep {
    param([object] $Node)

    if ($null -eq $Node) {
        return $null
    }

    if ($Node -is [hashtable]) {
        return $Node
    }

    if ($Node -is [System.Management.Automation.PSCustomObject]) {
        [hashtable] $ht = @{}

        foreach ($p in $Node.PSObject.Properties) {
            $ht[$p.Name] = ConvertTo-HashtableDeep -Node $p.Value
        }

        return $ht
    }

    return $Node
}

function Read-AppsettingsHashtable {
    param([string]$Rel)

    [string] $raw = Read-RepoText $Rel

    if ([string]::IsNullOrWhiteSpace($raw)) {
        return @{}
    }

    try {
        [object] $obj = $raw | ConvertFrom-Json -ErrorAction Stop -AsHashtable:$false
        [hashtable] $ht = ConvertTo-HashtableDeep -Node $obj

        if ($null -eq $ht) {
            return @{}
        }

        return $ht
    }
    catch {
        return @{}
    }
}

function Map-VerdictToExitWeight {
    param([string]$Verdict)

    switch ($Verdict) {
        "BLOCK" { return 2 }
        "WARN" { return 1 }
        default { return 0 }
    }
}

$script:MergedConfig = @{}
[hashtable] $base = Read-AppsettingsHashtable "ArchLucid.Api/appsettings.json"
[hashtable] $dev = Read-AppsettingsHashtable "ArchLucid.Api/appsettings.Development.json"
[hashtable] $merged = Merge-HashtableDeep -Base $base -Override $dev
Flatten-ConfigHashtable -Node $merged

[System.Collections.Generic.List[object]] $checks = [System.Collections.Generic.List[object]]::new()

# Repo layout
foreach ($rel in @(
        "docs/runbooks/PILOT_PREREQUISITES.md",
        "docs/library/CONFIGURATION_REFERENCE.md",
        "infra/terraform-pilot",
        "templates/architecture-requests/greenfield-design-review.json"
    )) {
    [string] $abs = Join-Path $root $rel
    [bool] $ok = Test-Path -LiteralPath $abs

    $checks.Add((Add-Check "Repo: $rel" $(if ($ok) { "PASS" } else { "BLOCK" }) $(if ($ok) { "present" } else { "missing" }))) | Out-Null
}

# Shared minimum keys
foreach ($key in @(
        "ConnectionStrings:ArchLucid",
        "ArchLucidAuth:Mode",
        "Hosting:Role",
        "AgentExecution:Mode"
    )) {
    [string] $val = Get-ConfigValue -ColonPath $key

    if ([string]::IsNullOrWhiteSpace($val)) {
        $checks.Add((Add-Check "Config: $key" "BLOCK" "not set in env or ArchLucid.Api/appsettings*.json")) | Out-Null
    }
    else {
        $checks.Add((Add-Check "Config: $key" "PASS" "present (value redacted)")) | Out-Null
    }
}

# StagingRealLlm + ProductionLike
if ($Profile -eq "StagingRealLlm" -or $Profile -eq "ProductionLike") {
    foreach ($key in @(
            "AzureOpenAI:Endpoint",
            "AzureOpenAI:DeploymentName"
        )) {
        [string] $val = Get-ConfigValue -ColonPath $key
        [bool] $hasKey = -not [string]::IsNullOrWhiteSpace((Get-ConfigValue -ColonPath "AzureOpenAI:ApiKey"))
        [string] $authMode = Get-ConfigValue -ColonPath "AzureOpenAI:AuthenticationMode"
        [bool] $hasMi = ($authMode -eq "ManagedIdentity")

        if ([string]::IsNullOrWhiteSpace($val)) {
            $checks.Add((Add-Check "Config: $key" "BLOCK" "required for StagingRealLlm / ProductionLike")) | Out-Null
        }
        else {
            $checks.Add((Add-Check "Config: $key" "PASS" "present (value redacted)")) | Out-Null
        }

        if (-not $hasKey -and -not $hasMi) {
            $checks.Add((Add-Check "Config: AzureOpenAI credential path" "WARN" "set AzureOpenAI:ApiKey or AzureOpenAI:AuthenticationMode=ManagedIdentity")) | Out-Null
        }
        else {
            $checks.Add((Add-Check "Config: AzureOpenAI credential path" "PASS" "api key or managed identity indicated")) | Out-Null
        }
    }
}

# ProductionLike — Azure AI Search blocking
if ($Profile -eq "ProductionLike") {
    [string] $vectorIndex = Get-ConfigValue -ColonPath "Retrieval:VectorIndex"
    [string] $searchEndpoint = Get-ConfigValue -ColonPath "Retrieval:AzureSearch:Endpoint"

    if ($vectorIndex -ne "AzureSearch") {
        $checks.Add((Add-Check "Azure AI Search: Retrieval:VectorIndex=AzureSearch" "BLOCK" "production-like requires AzureSearch; current='$vectorIndex'")) | Out-Null
    }
    else {
        $checks.Add((Add-Check "Azure AI Search: Retrieval:VectorIndex=AzureSearch" "PASS" "AzureSearch")) | Out-Null
    }

    if ([string]::IsNullOrWhiteSpace($searchEndpoint)) {
        $checks.Add((Add-Check "Azure AI Search: Retrieval:AzureSearch:Endpoint" "BLOCK" "endpoint required for production-like profiles (owner 2026-05-29)")) | Out-Null
    }
    else {
        $checks.Add((Add-Check "Azure AI Search: Retrieval:AzureSearch:Endpoint" "PASS" "present (value redacted)")) | Out-Null
    }

    [string] $telemetry = Get-ConfigValue -ColonPath "ProductionValidation:RequireTelemetryExport"

    if ($telemetry -ne "true") {
        $checks.Add((Add-Check "Telemetry: ProductionValidation:RequireTelemetryExport" "WARN" "recommended true for production-like hosted pilots")) | Out-Null
    }
    else {
        $checks.Add((Add-Check "Telemetry: ProductionValidation:RequireTelemetryExport" "PASS" "true")) | Out-Null
    }
}
elseif ($Profile -eq "StagingRealLlm") {
    [string] $vectorIndex = Get-ConfigValue -ColonPath "Retrieval:VectorIndex"

    if ($vectorIndex -eq "InMemory" -or [string]::IsNullOrWhiteSpace($vectorIndex)) {
        $checks.Add((Add-Check "Azure AI Search (staging)" "WARN" "InMemory/unset OK for internal staging — label proof artifacts non-production-like")) | Out-Null
    }
    else {
        $checks.Add((Add-Check "Azure AI Search (staging)" "PASS" "Retrieval:VectorIndex=$vectorIndex")) | Out-Null
    }
}

[int] $exitWeight = 0

foreach ($c in $checks) {
    [int] $w = Map-VerdictToExitWeight -Verdict $c.verdict

    if ($w -gt $exitWeight) {
        $exitWeight = $w
    }
}

[object] $report = [ordered]@{
    profile = $Profile
    generatedUtc = (Get-Date).ToUniversalTime().ToString("o")
    checks = @($checks)
    exitCode = $exitWeight
    doc = "docs/runbooks/PILOT_PREREQUISITES.md"
}

[string] $mdDir = Split-Path -Parent $MarkdownOut

if (-not [string]::IsNullOrWhiteSpace($mdDir)) {
    New-Item -ItemType Directory -Force -Path (Join-Path $root $mdDir) | Out-Null
}

[string] $jsonDir = Split-Path -Parent $JsonOut

if (-not [string]::IsNullOrWhiteSpace($jsonDir)) {
    New-Item -ItemType Directory -Force -Path (Join-Path $root $jsonDir) | Out-Null
}

[string] $jsonPath = Join-Path $root $JsonOut
$report | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $jsonPath -Encoding utf8

[string] $mdPath = Join-Path $root $MarkdownOut
[System.Text.StringBuilder] $sb = [System.Text.StringBuilder]::new()
[void] $sb.AppendLine("# Pilot prerequisites report ($Profile)")
[void] $sb.AppendLine("")
[void] $sb.AppendLine("Generated: $($report.generatedUtc)")
[void] $sb.AppendLine("")
[void] $sb.AppendLine("Canonical doc: docs/runbooks/PILOT_PREREQUISITES.md")
[void] $sb.AppendLine("")
[void] $sb.AppendLine("| Check | Verdict | Detail |")
[void] $sb.AppendLine("| --- | --- | --- |")

foreach ($c in $checks) {
    [string] $detail = ($c.detail -replace '\|', '/')
    [void] $sb.AppendLine("| $($c.name) | $($c.verdict) | $detail |")
}

[void] $sb.AppendLine("")
[void] $sb.AppendLine("Exit code: $exitWeight (0=PASS, 1=WARN, 2=BLOCK)")
Set-Content -LiteralPath $mdPath -Value $sb.ToString() -Encoding utf8

Write-Host "Wrote $MarkdownOut and $JsonOut (exit $exitWeight)"
exit $exitWeight
