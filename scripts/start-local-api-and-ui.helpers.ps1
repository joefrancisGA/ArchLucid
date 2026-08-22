#Requires -Version 5.1
# Command builders for start-local-api-and-ui.ps1.
# Local `dotnet run` otherwise uses the SDK terminal logger and parallel MSBuild nodes.
# That combination can restore for minutes, then dump back to the prompt with no error when
# a worker dies (MSB4166 / broken pipe). These flags keep errors visible and serialize MSBuild.

Set-StrictMode -Version Latest

function Get-LocalApiRelativeProjectPath {
    return '.\ArchLucid.Api\ArchLucid.Api.csproj'
}

function ConvertTo-PowerShellSingleQuotedLiteral {
    param(
        [Parameter(Mandatory = $true)]
        [string] $Value
    )

    return ("'{0}'" -f ($Value.Replace("'", "''")))
}

function Get-LocalApiDotnetBuildCommand {
    param(
        [ValidateRange(1, 64)]
        [int] $MsBuildMaxCpuCount = 1,

        [bool] $UseTerminalLogger = $false,

        [bool] $RunAnalyzers = $false
    )

    [System.Collections.Generic.List[string]] $parts = [System.Collections.Generic.List[string]]::new()
    $parts.Add('dotnet')
    $parts.Add('build')
    $parts.Add((Get-LocalApiRelativeProjectPath))
    $parts.Add('-c')
    $parts.Add('Debug')
    $parts.Add(('-m:{0}' -f $MsBuildMaxCpuCount))

    if (-not $UseTerminalLogger) {
        $parts.Add('-tl:off')
    }

    $parts.Add('--disable-build-servers')
    $parts.Add('-v')
    $parts.Add('minimal')

    if (-not $RunAnalyzers) {
        $parts.Add('-p:RunAnalyzers=false')
        $parts.Add('-p:EnforceCodeStyleInBuild=false')
    }

    return ($parts -join ' ')
}

function Get-LocalApiDotnetRunCommand {
    param(
        [Parameter(Mandatory = $true)]
        [ValidateNotNullOrEmpty()]
        [string] $LaunchProfile,

        [bool] $UseTerminalLogger = $false,

        [bool] $NoBuild = $true
    )

    [System.Collections.Generic.List[string]] $parts = [System.Collections.Generic.List[string]]::new()
    $parts.Add('dotnet')
    $parts.Add('run')
    $parts.Add('--project')
    $parts.Add((Get-LocalApiRelativeProjectPath))
    $parts.Add('--launch-profile')
    $parts.Add($LaunchProfile)

    if ($NoBuild) {
        $parts.Add('--no-build')
    }

    if (-not $UseTerminalLogger) {
        $parts.Add('-tl:off')
    }

    return ($parts -join ' ')
}

function Get-LocalApiWindowCommand {
    param(
        [Parameter(Mandatory = $true)]
        [string] $RepoRoot,

        [ValidateNotNullOrEmpty()]
        [string] $LaunchProfile = 'http',

        [ValidateRange(1, 64)]
        [int] $MsBuildMaxCpuCount = 1,

        [bool] $UseTerminalLogger = $false,

        [bool] $RunAnalyzers = $false,

        [bool] $SkipBuildServerShutdown = $false,

        [bool] $SkipExplicitBuild = $false
    )

    [string] $quotedRoot = ConvertTo-PowerShellSingleQuotedLiteral -Value $RepoRoot
    [System.Collections.Generic.List[string]] $lines = [System.Collections.Generic.List[string]]::new()
    $lines.Add("Set-Location -LiteralPath $quotedRoot")
    $lines.Add('$env:MSBUILDDISABLENODEREUSE = ''1''')

    if (-not $SkipBuildServerShutdown) {
        $lines.Add('Write-Host ''Shutting down leftover MSBuild/Roslyn servers...''')
        $lines.Add('dotnet build-server shutdown')
    }

    if ($SkipExplicitBuild) {
        $lines.Add('Write-Host ''Starting API (dotnet run)...''')
        $lines.Add((
                Get-LocalApiDotnetRunCommand `
                    -LaunchProfile $LaunchProfile `
                    -UseTerminalLogger $UseTerminalLogger `
                    -NoBuild $false
            ))

        return ($lines -join '; ')
    }

    $lines.Add('Write-Host ''Building ArchLucid.Api (first compile can take several minutes)...''')
    $lines.Add((
            Get-LocalApiDotnetBuildCommand `
                -MsBuildMaxCpuCount $MsBuildMaxCpuCount `
                -UseTerminalLogger $UseTerminalLogger `
                -RunAnalyzers $RunAnalyzers
        ))
    $lines.Add('if ($LASTEXITCODE -ne 0) { Write-Host (''API build failed with exit code {0}. This window stays open.'' -f $LASTEXITCODE) } else { Write-Host ''Starting API (dotnet run --no-build)...''; ' + (
            Get-LocalApiDotnetRunCommand `
                -LaunchProfile $LaunchProfile `
                -UseTerminalLogger $UseTerminalLogger `
                -NoBuild $true
        ) + ' }')

    return ($lines -join '; ')
}