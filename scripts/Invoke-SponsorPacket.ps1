<#
.SYNOPSIS
    One-command sponsor packet for a committed run (T2-7).

.DESCRIPTION
    Wraps `archlucid sponsor-packet` to produce a buyer-ready folder (and optional ZIP)
    with index.md, first-value report, pilot deltas, Sponsor report, limitations, and provenance refs.

.PARAMETER RunId
    Committed architecture run id (32-char hex, with or without dashes).

.PARAMETER OutputDirectory
    Folder for the packet. Default: artifacts/sponsor-packet/<RunId>

.PARAMETER ZipPath
    Optional ZIP path. When set, archives the folder after generation.

.PARAMETER ApiBaseUrl
    Optional API base URL override (otherwise from .archlucid/config.json or ARCHLUCID_API_BASE_URL).

.EXAMPLE
    ./scripts/Invoke-SponsorPacket.ps1 -RunId aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa

.EXAMPLE
    ./scripts/Invoke-SponsorPacket.ps1 -RunId $runId -ZipPath artifacts/sponsor-packet.zip
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string] $RunId,

    [string] $OutputDirectory,

    [string] $ZipPath,

    [string] $ApiBaseUrl
)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$cliProject = Join-Path $repoRoot 'ArchLucid.Cli\ArchLucid.Cli.csproj'

if (-not (Test-Path -LiteralPath $cliProject)) {
    throw "CLI project not found: $cliProject"
}

$args = @('run', '--project', $cliProject, '--', 'sponsor-packet', $RunId)

if ($OutputDirectory) {
    $args += @('--out', $OutputDirectory)
}

if ($ZipPath) {
    $args += @('--zip', $ZipPath)
}

if ($ApiBaseUrl) {
    $env:ARCHLUCID_API_BASE_URL = $ApiBaseUrl
}

& dotnet @args
exit $LASTEXITCODE
