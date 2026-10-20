#Requires -Version 7.0
# Run: Invoke-Pester -Strict -EnableExit -Path 'scripts/tests/Invoke-SecureNowAzurePackage.Tests.ps1'
Set-StrictMode -Version Latest

Describe "Invoke-SecureNowAzurePackage.ps1" {

    BeforeAll {
        [string]$script:cliScript = Join-Path (Split-Path -Parent $PSScriptRoot) "Invoke-SecureNowAzurePackage.ps1"
        [string]$script:quickStartScript = Join-Path (Split-Path -Parent $PSScriptRoot) "azure/Run-SecureNowAzureExtractor.ps1"
        [string]$script:packageScript = Join-Path (Split-Path -Parent $PSScriptRoot) "azure/Get-SecureNowAzurePackage.ps1"
        [string]$script:helpersScript = Join-Path (Split-Path -Parent $PSScriptRoot) "azure/ArchLucid.ExtractorQuickStart.helpers.ps1"
    }

    It "exists next to the Hawaii shortcut and points at the SecureNow quick start" {
        Test-Path -LiteralPath $script:cliScript | Should -Be $true
        Test-Path -LiteralPath $script:quickStartScript | Should -Be $true

        [string]$content = Get-Content -LiteralPath $script:cliScript -Raw
        $content | Should -Match 'azure/Run-SecureNowAzureExtractor\.ps1'
        $content | Should -Match '\[string\]\s*\$OutputPath\s*=\s*""'
    }

    It "keeps Get-SecureNowAzurePackage OutputPath optional with the cwd default ZIP" {
        [string]$packageContent = Get-Content -LiteralPath $script:packageScript -Raw
        $packageContent | Should -Match '\[Parameter\(Mandatory\s*=\s*\$false\)\]\s*\r?\n\s*\[string\]\s*\$OutputPath\s*=\s*""'
        $packageContent | Should -Match 'Resolve-SecureNowAzureExtractorOutputPath\s+-OutputPath\s+\$OutputPath'

        . $script:helpersScript
        [string]$resolved = Resolve-SecureNowAzureExtractorOutputPath -OutputPath ""
        $resolved | Should -Be (Join-Path (Get-Location).Path "securenow-azure-package.zip")
    }

    It "forwards an explicit OutputPath and omits blank OutputPath so the quick start default applies" {
        [string]$content = Get-Content -LiteralPath $script:cliScript -Raw
        $content | Should -Match 'if\s*\(-not\s*\(\[string\]::IsNullOrWhiteSpace\(\$OutputPath\)\)\)'
        $content | Should -Match '\$quickStartParams\["OutputPath"\]\s*=\s*\$OutputPath\.Trim\(\)'
    }
}
