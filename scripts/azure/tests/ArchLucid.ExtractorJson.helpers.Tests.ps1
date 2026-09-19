#Requires -Version 7.0
# Run: Invoke-Pester -Strict -EnableExit -Path 'scripts/azure/tests/ArchLucid.ExtractorJson.helpers.Tests.ps1'
Set-StrictMode -Version Latest

Describe 'ArchLucid.ExtractorJson.helpers.ps1' {

    BeforeAll {
        [string]$script:helpersPath =
            Join-Path (Split-Path -Parent $PSScriptRoot) 'ArchLucid.ExtractorJson.helpers.ps1'

        . $script:helpersPath
    }

    It 'serializes zero rows as a JSON array' {
        [string]$json = ConvertTo-ArchLucidJsonArray -Items @()
        [object]$parsed = $json | ConvertFrom-Json

        @($parsed).Count | Should -Be 0
        $json.Trim() | Should -Be '[]'
    }

    It 'serializes a null Items value as an empty JSON array' {
        [string]$json = ConvertTo-ArchLucidJsonArray -Items $null

        $json.Trim() | Should -Be '[]'
    }

    It 'serializes one row as a JSON array instead of an unwrapped object' {
        [object]$row = [PSCustomObject]@{
            name = 'diag1'
            workspaceId = '/subscriptions/sub/resourceGroups/rg/providers/Microsoft.OperationalInsights/workspaces/ws1'
        }

        [string]$pipelineJson = @($row) | ConvertTo-Json -Depth 12 -Compress:$false
        [string]$helperJson = ConvertTo-ArchLucidJsonArray -Items @($row)
        [object]$pipelineParsed = $pipelineJson | ConvertFrom-Json
        [object]$helperParsed = $helperJson | ConvertFrom-Json

        $pipelineParsed -is [System.Array] | Should -Be $false
        @($helperParsed).Count | Should -Be 1
        @($helperParsed)[0].name | Should -Be 'diag1'
        $helperJson.Trim().StartsWith('[') | Should -Be $true
    }

    It 'serializes two rows as a JSON array' {
        [object[]]$rows = @(
            [PSCustomObject]@{ name = 'diag1' },
            [PSCustomObject]@{ name = 'diag2' }
        )

        [string]$json = ConvertTo-ArchLucidJsonArray -Items $rows
        [object[]]$parsed = @($json | ConvertFrom-Json)

        $parsed.Count | Should -Be 2
        $parsed[0].name | Should -Be 'diag1'
        $parsed[1].name | Should -Be 'diag2'
    }
}
