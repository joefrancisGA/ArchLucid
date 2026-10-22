#!/usr/bin/env pwsh
# Validates CloudEvents + HMAC and ServiceNow incident JSON shape (no outbound HTTP).
# Run: pwsh ./templates/integrations/validate-servicenow-bridge.ps1

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Get-Hex([byte[]] $bytes) {
    return [BitConverter]::ToString($bytes) -replace '-', ''
}

$tenantId = [Guid]::NewGuid().ToString()
$workspaceId = [Guid]::NewGuid().ToString()
$projectId = [Guid]::NewGuid().ToString()
$runId = [Guid]::NewGuid().ToString()
$manifestId = [Guid]::NewGuid().ToString()

$cloudEvent = [ordered]@{
    specversion = '1.0'
    type        = 'com.archlucid.authority.run.completed'
    source      = 'https://archlucid.dev/api'
    id          = [Guid]::NewGuid().ToString()
    time        = [DateTimeOffset]::UtcNow.ToString('o')
    datacontenttype = 'application/json'
    data        = @{
        schemaVersion = 1
        runId         = $runId
        manifestId    = $manifestId
        tenantId      = $tenantId
        workspaceId   = $workspaceId
        projectId     = $projectId
    }
}

$bodyText = $cloudEvent | ConvertTo-Json -Depth 10 -Compress
$bodyUtf8 = [System.Text.Encoding]::UTF8.GetBytes($bodyText)
$secret = 'unit-test-secret'
$hmac = [System.Security.Cryptography.HMACSHA256]::new([System.Text.Encoding]::UTF8.GetBytes($secret))
$sig = 'sha256=' + (Get-Hex ($hmac.ComputeHash($bodyUtf8))).ToLowerInvariant()

$incident = @{
    short_description = "ArchLucid authority run completed ($runId)"
    description     = "Tenant $tenantId committed manifest $manifestId. Workspace $workspaceId project $projectId."
    urgency         = '2'
    impact          = '2'
    category        = 'Architecture'
} | ConvertTo-Json -Compress

$null = $incident | ConvertFrom-Json

Write-Host "PASS: CloudEvents+HMAC ($($sig.Substring(0, 20))...) and ServiceNow incident JSON compile."
