#requires -Version 5.1
Set-StrictMode -Version Latest

function Get-TopProofFindingsForHandoff {
    param(
        [Parameter(Mandatory = $true)][object[]] $Findings,
        [int] $MaxRows = 5
    )

    $priority = @($Findings | Where-Object { $_.disposition -eq 'BLOCK' })
    $priority += @($Findings | Where-Object { $_.disposition -eq 'WARN' })

    return @($priority | Select-Object -First $MaxRows)
}

function Write-V1WorkflowHandoffArtifacts {
    param(
        [Parameter(Mandatory = $true)][string] $ProofDirectory,
        [Parameter(Mandatory = $true)][string] $SponsorPacketDisposition,
        [Parameter(Mandatory = $true)][int] $BlockCount,
        [Parameter(Mandatory = $true)][string[]] $DeferredScopeReasons,
        [Parameter(Mandatory = $true)][object[]] $Findings,
        [string] $RunId = '',
        [string] $CommercialNextAction = '',
        [string] $CommercialNextReason = ''
    )

    $runLabel = if ([string]::IsNullOrWhiteSpace($RunId)) { 'not supplied' } else { $RunId.Trim() }
    $topFindings = Get-TopProofFindingsForHandoff -Findings $Findings

    $comment = [System.Collections.Generic.List[string]]::new()
    $comment.Add('ArchLucid review package — V1 workflow handoff (no V1.1 connector required).')
    $comment.Add('')
    $comment.Add("Run id: ``$runLabel``")
    $comment.Add("Sponsor packet disposition: **$SponsorPacketDisposition**")
    $comment.Add("Blocking findings: $BlockCount")
    $comment.Add("Commercial next action: **$CommercialNextAction**")
    $comment.Add("Reason: $CommercialNextReason")
    $comment.Add('')
    $comment.Add('Attach from proof folder:')
    $comment.Add('- ``first-pilot-command-center.md`` (primary status)')
    $comment.Add('- ``go-no-go-summary.md`` / ``go-no-go-summary.json``')
    $comment.Add('- ``quote-to-proof-packet.md``')
    $comment.Add('- ``first-pilot-evidence/artifact-manifest.json`` (when -RunId supplied)')
    $comment.Add('- ``first-pilot-evidence/first-value-report.md`` (when collected)')
    $comment.Add('')
    $comment.Add('Top findings:')

    if ($topFindings.Count -eq 0) {
        $comment.Add('- None (PASS or readiness-only).')
    }
    else {
        foreach ($finding in $topFindings) {
            $comment.Add("- **$($finding.disposition)** ``$($finding.name)`` — $($finding.detail)")
        }
    }

    if (@($DeferredScopeReasons).Count -gt 0) {
        $comment.Add('')
        $comment.Add('Deferred scope (not V1 blockers):')

        foreach ($reason in $DeferredScopeReasons) {
            $comment.Add("- $reason")
        }
    }

    $comment.Add('')
    $comment.Add('Canonical runbook: docs/runbooks/V1_WORKFLOW_HANDOFF_GITHUB_AZDO.md')
    $comment.Add('V1.1 connectors (Jira, ServiceNow, Slack, Teams, MCP) are not required for this handoff.')

    $mdPath = Join-Path $ProofDirectory 'v1-workflow-handoff-comment.md'
    $jsonPath = Join-Path $ProofDirectory 'v1-workflow-handoff-comment.json'
    $comment | Set-Content -LiteralPath $mdPath -Encoding UTF8

    $payload = [ordered]@{
        generatedUtc            = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')
        sponsorPacketDisposition  = $SponsorPacketDisposition
        blockCount              = $BlockCount
        runId                   = if ([string]::IsNullOrWhiteSpace($RunId)) { $null } else { $RunId.Trim() }
        commercialNextAction    = $CommercialNextAction
        commercialNextReason    = $CommercialNextReason
        deferredScopeReasons    = @($DeferredScopeReasons)
        topFindings             = @($topFindings | ForEach-Object {
            [ordered]@{
                disposition = [string]$_.disposition
                name        = [string]$_.name
                detail      = [string]$_.detail
            }
        })
        pasteTargets            = @(
            'GitHub PR comment',
            'GitHub issue',
            'Azure DevOps work item',
            'Azure DevOps pipeline summary'
        )
    }

    $payload | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $jsonPath -Encoding UTF8

    return [ordered]@{
        mdPath   = 'v1-workflow-handoff-comment.md'
        jsonPath = 'v1-workflow-handoff-comment.json'
    }
}
