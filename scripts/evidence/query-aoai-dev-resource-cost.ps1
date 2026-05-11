#!/usr/bin/env pwsh
<#
.SYNOPSIS
  Queries Azure Cost Management (ActualCost) for `oai-archlucid-dev` — dev subscription only.

.DESCRIPTION
  Billing data can lag 24–48 hours and RBAC requires Cost Management Reader (or higher).
  Resource-level filters may return empty rows when usage is zero or attribution rolls up differently.

.PARAMETER SubscriptionId
  Defaults to `ArchLucid DEV` subscription used during evidence capture.

.PARAMETER ResourceGroup
  Defaults to `rg-ArchLucid-dev`.

.PARAMETER AccountName
  Defaults to `oai-archlucid-dev`.

.PARAMETER FromUtc
.PARAMETER ToUtc
  ISO date boundaries for Cost Management `timePeriod`.
#>
param(
    [string] $SubscriptionId = "8aa56f3b-18bc-43ca-ad45-bad9e811d33b",
    [string] $ResourceGroup = "rg-ArchLucid-dev",
    [string] $AccountName = "oai-archlucid-dev",
    [string] $FromUtc = "2026-03-01T00:00:00Z",
    [string] $ToUtc = "2026-05-11T00:00:00Z"
)

$ErrorActionPreference = "Stop"

$rid = "/subscriptions/$SubscriptionId/resourceGroups/$ResourceGroup/providers/Microsoft.CognitiveServices/accounts/$AccountName"
$bodyObj = @{
    type       = "ActualCost"
    timeframe  = "Custom"
    timePeriod = @{ from = $FromUtc; to = $ToUtc }
    dataset    = @{
        granularity = "None"
        aggregation = @{
            totalCost = @{ name = "PreTaxCost"; function = "Sum" }
        }
        filter      = @{
            dimensions = @{
                name     = "ResourceId"
                operator = "In"
                values   = @($rid)
            }
        }
    }
}

$tmp = [System.IO.Path]::GetTempFileName()

try {
    $bodyObj | ConvertTo-Json -Depth 12 | Set-Content -LiteralPath $tmp -Encoding utf8

    az rest --method post `
        --uri "https://management.azure.com/subscriptions/$SubscriptionId/providers/Microsoft.CostManagement/query?api-version=2023-03-01" `
        --headers "Content-Type=application/json" `
        --body "@$tmp"
}
finally {
    Remove-Item -LiteralPath $tmp -Force -ErrorAction SilentlyContinue
}
