# Ordered ArchiForge.* -> ArchLucid.* in source-like files under repo root.
$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path

$map = @(
    'ArchiForge.Persistence.Runtime', 'ArchLucid.Persistence.Runtime',
    'ArchiForge.Persistence.Integration', 'ArchLucid.Persistence.Integration',
    'ArchiForge.Persistence.Advisory', 'ArchLucid.Persistence.Advisory',
    'ArchiForge.Persistence.Alerts', 'ArchLucid.Persistence.Alerts',
    'ArchiForge.Persistence', 'ArchLucid.Persistence',
    'ArchiForge.Host.Composition', 'ArchLucid.Host.Composition',
    'ArchiForge.Host.Core', 'ArchLucid.Host.Core',
    'ArchiForge.ContextIngestion', 'ArchLucid.ContextIngestion',
    'ArchiForge.KnowledgeGraph', 'ArchLucid.KnowledgeGraph',
    'ArchiForge.ArtifactSynthesis', 'ArchLucid.ArtifactSynthesis',
    'ArchiForge.AgentSimulator', 'ArchLucid.AgentSimulator',
    'ArchiForge.AgentRuntime', 'ArchLucid.AgentRuntime',
    'ArchiForge.Application', 'ArchLucid.Application',
    'ArchiForge.Api.Client', 'ArchLucid.Api.Client',
    'ArchiForge.Api', 'ArchLucid.Api',
    'ArchiForge.Worker', 'ArchLucid.Worker',
    'ArchiForge.Backfill.Cli', 'ArchLucid.Backfill.Cli',
    'ArchiForge.Cli', 'ArchLucid.Cli',
    'ArchiForge.Coordinator', 'ArchLucid.Coordinator',
    'ArchiForge.Decisioning', 'ArchLucid.Decisioning',
    'ArchiForge.Provenance', 'ArchLucid.Provenance',
    'ArchiForge.Retrieval', 'ArchLucid.Retrieval',
    'ArchiForge.TestSupport', 'ArchLucid.TestSupport',
    'ArchiForge.Benchmarks', 'ArchLucid.Benchmarks',
    'ArchiForge.Core', 'ArchLucid.Core',
    'ArchiForge.Contracts', 'ArchLucid.Contracts'
)

function Test-ExcludedPath {
    param([string]$p)
    foreach ($x in @('\bin\', '\obj\', '\_docker_publish', '\artifacts-bench\', '\.git\', '\node_modules\')) {
        if ($p -like "*$x*") {
            return $true
        }
    }

    return $false
}

$globs = @('*.cs', '*.csproj', '*.sln', '*.props', '*.targets', '*.http', '*.runsettings', '*.mdc', '*.md', 'Dockerfile*', '*.yml', '*.yaml')
$files = foreach ($g in $globs) {
    Get-ChildItem -Path $root -Recurse -File -Filter $g -ErrorAction SilentlyContinue
}

$jsonExtra = @(
    (Join-Path $root 'ArchLucid.Api.Client\nswag.json'),
    (Join-Path $root 'global.json'),
    (Join-Path $root 'ci\benchmark-baseline.json')
) + (Get-ChildItem -Path $root -File -Filter 'stryker-config*.json' -ErrorAction SilentlyContinue | ForEach-Object { $_.FullName })

foreach ($jp in $jsonExtra) {
    if ($null -ne $jp -and (Test-Path -LiteralPath $jp)) {
        $files += Get-Item -LiteralPath $jp
    }
}

Get-ChildItem -Path $root -Recurse -File -Filter 'appsettings*.json' -ErrorAction SilentlyContinue | ForEach-Object { $files += $_ }

$files = $files | Where-Object { -not (Test-ExcludedPath $_.FullName) } | Sort-Object FullName -Unique

$count = 0
foreach ($f in $files) {
    $text = [System.IO.File]::ReadAllText($f.FullName)
    $orig = $text

    for ($i = 0; $i -lt $map.Count; $i += 2) {
        $text = $text.Replace($map[$i], $map[$i + 1])
    }

    if ($text -ne $orig) {
        [System.IO.File]::WriteAllText($f.FullName, $text, [System.Text.UTF8Encoding]::new($false))
        $count++
    }
}

Write-Host "Updated $count files under $root"
