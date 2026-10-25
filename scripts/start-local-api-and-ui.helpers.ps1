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

function Get-LocalDevNodeInstallCandidateDirectories {
    [System.Collections.Generic.List[string]] $dirs = [System.Collections.Generic.List[string]]::new()

    if (-not [string]::IsNullOrWhiteSpace($env:ProgramFiles)) {
        $dirs.Add((Join-Path $env:ProgramFiles 'nodejs'))
    }

    $programFilesX86 = ${env:ProgramFiles(x86)}

    if (-not [string]::IsNullOrWhiteSpace($programFilesX86)) {
        $dirs.Add((Join-Path $programFilesX86 'nodejs'))
    }

    if (-not [string]::IsNullOrWhiteSpace($env:LOCALAPPDATA)) {
        $dirs.Add((Join-Path $env:LOCALAPPDATA 'Programs\nodejs'))
    }

    return $dirs
}

function Ensure-LocalDevNodeOnPath {
    param(
        [ref] $NodeToolsDirectoryForSpawn = $null
    )

    if ($null -ne $NodeToolsDirectoryForSpawn) {
        $NodeToolsDirectoryForSpawn.Value = $null
    }

    if (Get-Command node -ErrorAction SilentlyContinue) {
        return $true
    }

    foreach ($dir in (Get-LocalDevNodeInstallCandidateDirectories)) {
        [string] $nodeExe = Join-Path $dir 'node.exe'

        if (-not (Test-Path -LiteralPath $nodeExe)) {
            continue
        }

        $env:PATH = ('{0};{1}' -f $dir, $env:PATH)

        if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
            continue
        }

        if ($null -ne $NodeToolsDirectoryForSpawn) {
            $NodeToolsDirectoryForSpawn.Value = $dir
        }

        return $true
    }

    return $false
}

function Get-LocalDevNodePathPrependCommand {
    param(
        [Parameter(Mandatory = $true)]
        [string] $NodeToolsDirectory
    )

    [string] $quotedDirWithSemi = ConvertTo-PowerShellSingleQuotedLiteral -Value ("{0};" -f $NodeToolsDirectory)

    return ('$env:PATH = {0} + $env:PATH' -f $quotedDirWithSemi)
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

function New-LocalUiSiteSpec {
    param(
        [Parameter(Mandatory = $true)]
        [string] $Name,

        [Parameter(Mandatory = $true)]
        [string] $ReadyLabel,

        [Parameter(Mandatory = $true)]
        [ValidateSet('architecture', 'security')]
        [string] $ProductLine,

        [Parameter(Mandatory = $true)]
        [string] $SiteKey,

        [string] $Edition = '',

        [string] $DistDir = '',

        [Parameter(Mandatory = $true)]
        [ValidateRange(1, 65535)]
        [int] $Port
    )

    # One API, one Next.js process per shell. Root and proxy URLs are what the starter waits on.
    return [pscustomobject]@{
        Name           = $Name
        ReadyLabel     = $ReadyLabel
        ProductLine    = $ProductLine
        SiteKey        = $SiteKey
        Edition        = $Edition
        DistDir        = $DistDir
        Port           = $Port
        RootUrl        = ('http://127.0.0.1:{0}/' -f $Port)
        ProxyHealthUrl = ('http://127.0.0.1:{0}/api/proxy/health/live' -f $Port)
    }
}

function Assert-LocalUiSitePortsDiffer {
    param(
        [Parameter(Mandatory = $true)]
        [System.Collections.Generic.List[object]] $Sites
    )

    [System.Collections.Generic.HashSet[int]] $seen = [System.Collections.Generic.HashSet[int]]::new()

    foreach ($site in $Sites) {

        if (-not $seen.Add([int]$site.Port)) {
            throw 'Local UI ports must differ.'
        }
    }
}

function Get-LocalUiSiteSpecs {
    param(
        [ValidateRange(1, 65535)]
        [int] $ArchitecturePort = 3000,

        [ValidateRange(1, 65535)]
        [int] $SecurityPort = 3001,

        [ValidateRange(1, 65535)]
        [int] $UhgSecurityPort = 3002,

        [bool] $IncludeArchitecture = $true,

        [bool] $IncludeSecurity = $true,

        [bool] $IncludeUhgSecurity = $false
    )

    if (-not $IncludeArchitecture -and -not $IncludeSecurity -and -not $IncludeUhgSecurity) {
        throw 'At least one UI product line must be included.'
    }

    [System.Collections.Generic.List[object]] $sites = [System.Collections.Generic.List[object]]::new()

    if ($IncludeArchitecture) {
        $sites.Add((New-LocalUiSiteSpec `
                -Name 'Architecture' `
                -ReadyLabel 'Architecture' `
                -ProductLine 'architecture' `
                -SiteKey 'architecture' `
                -Edition 'generic' `
                -Port $ArchitecturePort))
    }

    if ($IncludeSecurity) {
        # Generic SecureNow. Edition is set in the window so .env.local cannot flip this process to UHG.
        $sites.Add((New-LocalUiSiteSpec `
                -Name 'Security' `
                -ReadyLabel 'SecureNow' `
                -ProductLine 'security' `
                -SiteKey 'security-generic' `
                -Edition 'generic' `
                -DistDir '.next-security' `
                -Port $SecurityPort))
    }

    if ($IncludeUhgSecurity) {
        # UHG is a second SecureNow process, not a second API. Its own dist dir avoids the Next.js dev lock.
        $sites.Add((New-LocalUiSiteSpec `
                -Name 'SecureNow UHG' `
                -ReadyLabel 'SecureNow UHG' `
                -ProductLine 'security' `
                -SiteKey 'security-uhg' `
                -Edition 'uhg' `
                -DistDir '.next-security-uhg' `
                -Port $UhgSecurityPort))
    }

    Assert-LocalUiSitePortsDiffer -Sites $sites

    return $sites
}

function Get-LocalUiBrowserOpenPath {
    param(
        [Parameter(Mandatory = $true)]
        [ValidateSet('architecture', 'security')]
        [string] $ProductLine,

        [Parameter(Mandatory = $true)]
        [string] $RequestedOpenPath,

        [bool] $ArchitectureIncluded
    )

    if ($ProductLine -eq 'architecture') {
        return $RequestedOpenPath
    }

    # SecureNow-only starts always open home. An architecture-only path bounces in that shell.
    if (-not $ArchitectureIncluded) {
        return '/'
    }

    return $RequestedOpenPath
}

function Ensure-EnvLocalFromExample {
    param(
        [Parameter(Mandatory = $true)]
        [string] $EnvLocalPath,

        [Parameter(Mandatory = $true)]
        [string] $EnvExamplePath,

        [ValidateRange(1, 65535)]
        [int] $ApiPort = 5128
    )

    if (Test-Path -LiteralPath $EnvLocalPath) {
        return $false
    }

    if (-not (Test-Path -LiteralPath $EnvExamplePath)) {
        return $false
    }

    Copy-Item -LiteralPath $EnvExamplePath -Destination $EnvLocalPath

    if ($ApiPort -ne 5128) {
        [string[]] $lines = Get-Content -LiteralPath $EnvLocalPath
        [System.Collections.Generic.List[string]] $updated = [System.Collections.Generic.List[string]]::new()

        foreach ($line in $lines) {
            if ($line -match '^\s*(ARCHLUCID_API_BASE_URL|NEXT_PUBLIC_ARCHLUCID_API_BASE_URL)\s*=') {
                $updated.Add(($line -replace 'http://localhost:\d+', ('http://localhost:{0}' -f $ApiPort)))
            }
            else {
                $updated.Add($line)
            }
        }

        Set-Content -LiteralPath $EnvLocalPath -Value $updated -Encoding UTF8
    }

    return $true
}

function Get-LocalUiWindowCommand {
    param(
        [Parameter(Mandatory = $true)]
        [string] $UiRoot,

        [ValidateSet('architecture', 'security')]
        [string] $ProductLine = 'architecture',

        [ValidateSet('generic', 'uhg')]
        [string] $Edition,

        [string] $DistDir = '',

        [string] $WindowLabel = '',

        [ValidateRange(1, 65535)]
        [int] $Port = 3000,

        [string] $NodeToolsDirectory = ''
    )

    [string] $quotedRoot = ConvertTo-PowerShellSingleQuotedLiteral -Value $UiRoot
    [System.Collections.Generic.List[string]] $lines = [System.Collections.Generic.List[string]]::new()
    $lines.Add("Set-Location -LiteralPath $quotedRoot")

    if (-not [string]::IsNullOrWhiteSpace($NodeToolsDirectory)) {
        $lines.Add((Get-LocalDevNodePathPrependCommand -NodeToolsDirectory $NodeToolsDirectory))
    }
    # Engineer-local shell: show Internal nav (operator-system-admin) even when .env.local follows pilot API posture.
    $productEnvLine = '$env:NEXT_PUBLIC_ARCHLUCID_PRODUCT = ''{0}''' -f $ProductLine
    $lines.Add($productEnvLine)
    $lines.Add('$env:NEXT_PUBLIC_FEATURES_SHOW_SYSTEM_ADMINISTRATION_NAV = ''true''')
    $lines.Add('$env:NEXT_PUBLIC_OPERATOR_EXPERIENCE = ''operator''')

    if (-not [string]::IsNullOrWhiteSpace($Edition)) {
        # Process env wins over .env.local, so generic and UHG windows stay on the edition they were started as.
        $lines.Add(('$env:NEXT_PUBLIC_SECURENOW_EDITION = ''{0}''' -f $Edition))
    }

    [string] $resolvedDistDir = $DistDir

    if ([string]::IsNullOrWhiteSpace($resolvedDistDir) -and $ProductLine -eq 'security') {
        # Next.js 16+ dev lock is per distDir; Security must not share Architecture's `.next`.
        $resolvedDistDir = '.next-security'
    }

    if (-not [string]::IsNullOrWhiteSpace($resolvedDistDir)) {
        $lines.Add(('$env:NEXT_DIST_DIR = ''{0}''' -f $resolvedDistDir))
    }

    [string] $label = $WindowLabel

    if ([string]::IsNullOrWhiteSpace($label)) {
        $label = ('{0} UI' -f $ProductLine)
    }

    $lines.Add(('Write-Host ''Starting {0} on port {1}...''' -f $label, $Port))
    # Set product + port in this window. Do not use `npm run dev:security` here — that script
    # prefixes a Unix env assignment which Windows powershell.exe does not apply.
    $lines.Add(('npx --no-install next dev --webpack -p {0}' -f $Port))

    return ($lines -join '; ')
}

function Get-LocalUiWindowCommandForSite {
    param(
        [Parameter(Mandatory = $true)]
        [string] $UiRoot,

        [Parameter(Mandatory = $true)]
        $Site,

        [string] $NodeToolsDirectory = ''
    )

    $params = @{
        UiRoot      = $UiRoot
        ProductLine = [string]$Site.ProductLine
        Port        = [int]$Site.Port
        WindowLabel = [string]$Site.ReadyLabel
    }

    if (-not [string]::IsNullOrWhiteSpace($NodeToolsDirectory)) {
        $params['NodeToolsDirectory'] = $NodeToolsDirectory
    }

    if (-not [string]::IsNullOrWhiteSpace([string]$Site.Edition)) {
        $params['Edition'] = [string]$Site.Edition
    }

    if (-not [string]::IsNullOrWhiteSpace([string]$Site.DistDir)) {
        $params['DistDir'] = [string]$Site.DistDir
    }

    return Get-LocalUiWindowCommand @params
}