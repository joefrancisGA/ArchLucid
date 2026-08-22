#Requires -Version 7.0
# Run: Invoke-Pester -Strict -EnableExit -Path 'scripts/tests/start-local-api-and-ui.Tests.ps1'
Set-StrictMode -Version Latest

Describe 'start-local-api-and-ui.helpers.ps1' {

    BeforeAll {
        [string]$script:repoRoot = Split-Path -Parent $PSScriptRoot
        [string]$script:helpersPath = Join-Path $script:repoRoot 'start-local-api-and-ui.helpers.ps1'
        . $script:helpersPath
    }

    It 'quotes PowerShell single-quoted literals and doubles embedded apostrophes' {
        ConvertTo-PowerShellSingleQuotedLiteral -Value 'C:\ArchLucid' | Should -Be "'C:\ArchLucid'"
        ConvertTo-PowerShellSingleQuotedLiteral -Value "C:\O'Brien" | Should -Be "'C:\O''Brien'"
    }

    It 'builds a serial Debug API compile with terminal logger off and analyzers skipped' {
        [string]$command = Get-LocalApiDotnetBuildCommand

        $command | Should -Be 'dotnet build .\ArchLucid.Api\ArchLucid.Api.csproj -c Debug -m:1 -tl:off --disable-build-servers -v minimal -p:RunAnalyzers=false -p:EnforceCodeStyleInBuild=false'
    }

    It 'honors parallel MSBuild, terminal logger, and analyzer opt-in on build' {
        [string]$command = Get-LocalApiDotnetBuildCommand `
            -MsBuildMaxCpuCount 4 `
            -UseTerminalLogger $true `
            -RunAnalyzers $true

        $command | Should -Be 'dotnet build .\ArchLucid.Api\ArchLucid.Api.csproj -c Debug -m:4 --disable-build-servers -v minimal'
        $command | Should -Not -Match '-tl:off'
        $command | Should -Not -Match 'RunAnalyzers=false'
    }

    It 'builds dotnet run with launch profile, --no-build, and terminal logger off' {
        [string]$command = Get-LocalApiDotnetRunCommand -LaunchProfile 'http'

        $command | Should -Be 'dotnet run --project .\ArchLucid.Api\ArchLucid.Api.csproj --launch-profile http --no-build -tl:off'
    }

    It 'omits --no-build and -tl:off when those flags are disabled' {
        [string]$command = Get-LocalApiDotnetRunCommand `
            -LaunchProfile 'https' `
            -UseTerminalLogger $true `
            -NoBuild $false

        $command | Should -Be 'dotnet run --project .\ArchLucid.Api\ArchLucid.Api.csproj --launch-profile https'
    }

    It 'builds the default API window command with shutdown, explicit build, and --no-build run' {
        [string]$command = Get-LocalApiWindowCommand -RepoRoot 'C:\ArchLucid\ArchLucid'

        $command | Should -Match "Set-Location -LiteralPath 'C:\\ArchLucid\\ArchLucid'"
        $command | Should -Match '\$env:MSBUILDDISABLENODEREUSE = ''1'''
        $command | Should -Match 'dotnet build-server shutdown'
        $command | Should -Match 'dotnet build \.\\ArchLucid\.Api\\ArchLucid\.Api\.csproj'
        $command | Should -Match '-m:1'
        $command | Should -Match '-tl:off'
        $command | Should -Match '--launch-profile http'
        $command | Should -Match '--no-build'
        $command | Should -Match '\$LASTEXITCODE -ne 0'
        $command | Should -Not -Match 'Write-Host \("'
        $command | Should -Match "Write-Host \('API build failed with exit code \{0\}"
    }

    It 'skips build-server shutdown and explicit build when requested' {
        [string]$command = Get-LocalApiWindowCommand `
            -RepoRoot 'C:\ArchLucid\ArchLucid' `
            -LaunchProfile 'https' `
            -SkipBuildServerShutdown $true `
            -SkipExplicitBuild $true

        $command | Should -Not -Match 'build-server shutdown'
        $command | Should -Not -Match 'dotnet build '
        $command | Should -Not -Match '--no-build'
        $command | Should -Match '--launch-profile https'
        $command | Should -Match 'dotnet run --project'
    }

    It 'doubles apostrophes in the repo root for the spawned window command' {
        [string]$command = Get-LocalApiWindowCommand -RepoRoot "C:\O'Brien\ArchLucid"

        $command | Should -Match "Set-Location -LiteralPath 'C:\\O''Brien\\ArchLucid'"
    }
}