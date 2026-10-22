# ArchiForge -> ArchLucid Phase 5 (project dirs/csproj) + Phase 6 (namespaces in .cs).
# Run from repo root: pwsh -File scripts/migrate-phase5-phase6.ps1
# Requires: git, pwsh. Stages moves + renames; run bulk text pass after.

$ErrorActionPreference = 'Stop'
# Repo root is parent of scripts/
$root = Split-Path -Parent $PSScriptRoot
if (-not (Test-Path (Join-Path $root 'ArchLucid.sln')) -and -not (Test-Path (Join-Path $root 'ArchLucid.sln'))) {
    $root = (Get-Location).Path
}

Set-Location $root

$map = @(
    @{ Old = 'ArchiForge.Persistence.Runtime'; New = 'ArchLucid.Persistence.Runtime' },
    @{ Old = 'ArchiForge.Persistence.Integration'; New = 'ArchLucid.Persistence.Integration' },
    @{ Old = 'ArchiForge.Persistence.Advisory'; New = 'ArchLucid.Persistence.Advisory' },
    @{ Old = 'ArchiForge.Persistence.Alerts'; New = 'ArchLucid.Persistence.Alerts' },
    @{ Old = 'ArchiForge.Persistence'; New = 'ArchLucid.Persistence' },
    @{ Old = 'ArchiForge.Host.Composition'; New = 'ArchLucid.Host.Composition' },
    @{ Old = 'ArchiForge.Host.Core'; New = 'ArchLucid.Host.Core' },
    @{ Old = 'ArchiForge.ContextIngestion'; New = 'ArchLucid.ContextIngestion' },
    @{ Old = 'ArchiForge.KnowledgeGraph'; New = 'ArchLucid.KnowledgeGraph' },
    @{ Old = 'ArchiForge.ArtifactSynthesis'; New = 'ArchLucid.ArtifactSynthesis' },
    @{ Old = 'ArchiForge.AgentSimulator'; New = 'ArchLucid.AgentSimulator' },
    @{ Old = 'ArchiForge.AgentRuntime'; New = 'ArchLucid.AgentRuntime' },
    @{ Old = 'ArchiForge.Application'; New = 'ArchLucid.Application' },
    @{ Old = 'ArchiForge.Api.Client'; New = 'ArchLucid.Api.Client' },
    @{ Old = 'ArchiForge.Api'; New = 'ArchLucid.Api' },
    @{ Old = 'ArchiForge.Worker'; New = 'ArchLucid.Worker' },
    @{ Old = 'ArchiForge.Backfill.Cli'; New = 'ArchLucid.Backfill.Cli' },
    @{ Old = 'ArchiForge.Cli'; New = 'ArchLucid.Cli' },
    @{ Old = 'ArchiForge.Coordinator'; New = 'ArchLucid.Coordinator' },
    @{ Old = 'ArchiForge.Decisioning'; New = 'ArchLucid.Decisioning' },
    @{ Old = 'ArchiForge.Provenance'; New = 'ArchLucid.Provenance' },
    @{ Old = 'ArchiForge.Retrieval'; New = 'ArchLucid.Retrieval' },
    @{ Old = 'ArchiForge.TestSupport'; New = 'ArchLucid.TestSupport' },
    @{ Old = 'ArchiForge.Benchmarks'; New = 'ArchLucid.Benchmarks' },
    @{ Old = 'ArchiForge.Core'; New = 'ArchLucid.Core' },
    @{ Old = 'ArchiForge.Contracts'; New = 'ArchLucid.Contracts' }
)

foreach ($m in $map) {
    $oldDir = Join-Path $root $m.Old
    $newDir = Join-Path $root $m.New
    if (-not (Test-Path $oldDir)) {
        Write-Host "SKIP (missing): $($m.Old)"
        continue
    }
    if (Test-Path $newDir) {
        Write-Host "SKIP (exists): $($m.New)"
        continue
    }
    Write-Host "git mv $($m.Old) -> $($m.New)"
    git mv $m.Old $m.New
    $oldCsproj = Join-Path $newDir ($m.Old + '.csproj')
    $newCsproj = Join-Path $newDir ($m.New + '.csproj')
    if (Test-Path $oldCsproj) {
        git mv $oldCsproj $newCsproj
    }
}

Write-Host 'Done phase5 folder moves.'
