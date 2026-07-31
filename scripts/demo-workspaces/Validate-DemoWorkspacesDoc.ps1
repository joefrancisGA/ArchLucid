# Validates docs/go-to-market/DEMO_QUICKSTART.md#demo-workspaces cites pinned fixture GUID anchors.
# Path-stable alias: docs/go-to-market/DEMO_WORKSPACES.md. Manifest: fixtures/demo-workspaces/demo-workspaces.fixture.manifest.json.
param(
    [string] $RepoRoot = ''
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

if ([string]::IsNullOrWhiteSpace($RepoRoot)) {
    $RepoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
}

$manifestPath = Join-Path $RepoRoot 'fixtures/demo-workspaces/demo-workspaces.fixture.manifest.json'
$docPath = Join-Path $RepoRoot 'docs/go-to-market/DEMO_QUICKSTART.md'
$aliasPath = Join-Path $RepoRoot 'docs/go-to-market/DEMO_WORKSPACES.md'

function Require-PathExists([string]$Path, [string]$Label) {
    if (-not (Test-Path -LiteralPath $Path)) {
        throw "$Label not found: $Path"
    }
}

Require-PathExists $manifestPath 'Pinned demo fixture manifest'
Require-PathExists $docPath 'DEMO_QUICKSTART.md'
Require-PathExists $aliasPath 'DEMO_WORKSPACES.md (path-stable alias)'

$manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
$doc = Get-Content -LiteralPath $docPath -Raw

function Require-DocContainsGuid([string]$DocText, [string]$Guid, [string]$Label) {
    $lower = $DocText.ToLowerInvariant()
    $hy = $Guid.ToLowerInvariant()
    $compact = $Guid.Replace('-', '').ToLowerInvariant()

    if ($lower.Contains($hy) -or $lower.Contains($compact)) {
        return
    }

    throw "DEMO_QUICKSTART.md missing expected anchor for ${Label}: include hyphenated '$Guid' or compact '$compact'."
}

Require-DocContainsGuid $doc $manifest.defaultTenantId 'defaultTenantId'
Require-DocContainsGuid $doc $manifest.workspaceA.runId 'workspaceA.runId'
Require-DocContainsGuid $doc $manifest.workspaceA.workspaceId 'workspaceA.workspaceId'
Require-DocContainsGuid $doc $manifest.workspaceA.projectId 'workspaceA.projectId'
Require-DocContainsGuid $doc $manifest.workspaceB.runId 'workspaceB.runId'
Require-DocContainsGuid $doc $manifest.workspaceB.workspaceId 'workspaceB.workspaceId'
Require-DocContainsGuid $doc $manifest.workspaceB.projectId 'workspaceB.projectId'

Write-Host "OK: DEMO_QUICKSTART.md#demo-workspaces matches pinned manifest anchors ($($manifest.fixturePackageId) $($manifest.fixturePackageVersion))."
