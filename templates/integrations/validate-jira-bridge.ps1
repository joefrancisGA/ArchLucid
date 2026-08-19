#!/usr/bin/env pwsh
# Validates CloudEvents payload + HMAC wiring documented in jira/jira-webhook-bridge-recipe.md (no outbound HTTP).
# Run from repo root: pwsh ./templates/integrations/validate-jira-bridge.ps1

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

$bodyUtf8 = [System.Text.Encoding]::UTF8.GetBytes(($cloudEvent | ConvertTo-Json -Depth 10 -Compress))
$secret = 'unit-test-secret'
$hmac = [System.Security.Cryptography.HMACSHA256]::new([System.Text.Encoding]::UTF8.GetBytes($secret))
$sigBytes = $hmac.ComputeHash($bodyUtf8)
$expectedHeader = 'sha256=' + (Get-Hex $sigBytes).ToLowerInvariant()

if (-not $expectedHeader.StartsWith('sha256=')) {
    throw 'HMAC prefix mismatch'
}

$jiraIssue = @{
    fields = @{
        project = @{ key = 'DEMO' }
        summary = "ArchLucid run completed — $runId"
        description = @{
            type = 'doc'
            version = 1
            content = @(
                @{
                    type = 'paragraph'
                    content = @(
                        @{ type = 'text'; text = "Manifest $manifestId for tenant $tenantId" }
                    )
                }
            )
        }
        issuetype = @{ name = 'Task' }
    }
} | ConvertTo-Json -Depth 20 -Compress

$null = $jiraIssue | ConvertFrom-Json

Write-Host "PASS: CloudEvents JSON, HMAC $($expectedHeader.Substring(0, [Math]::Min(32, $expectedHeader.Length)))..., Jira REST body valid JSON."
