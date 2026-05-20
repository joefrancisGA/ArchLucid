# Generates ArchLucid.Active.slnf from recently touched source (git + local mtime).
# Keeps the C# language server focused on what you actually edit across the monorepo.
#
# Usage (from repo root):
#   pwsh scripts/dev/Update-ArchLucidActiveSolutionFilter.ps1
#   pwsh scripts/dev/Update-ArchLucidActiveSolutionFilter.ps1 -Days 14 -MaxProjects 16
#
# After updating: restart the .NET language server or reload the Cursor window.

[CmdletBinding()]
param(
    [int] $Days = 21,
    [int] $MaxProjects = 18,
    [string] $OutputFileName = "ArchLucid.Active.slnf"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
Set-Location $repoRoot

function Get-NormalizedProjectPath {
    param([string] $RelativePath)
    return ($RelativePath -replace "\\", "/")
}

function Get-ProjectDirectoryName {
    param([string] $ProjectRelativePath)
    $dir = Split-Path $ProjectRelativePath -Parent
    if ([string]::IsNullOrWhiteSpace($dir)) {
        return (Split-Path $ProjectRelativePath -LeafBase)
    }
    return (Split-Path $dir -Leaf)
}

function Get-ProjectReferences {
    param([string] $ProjectRelativePath)

    $fullPath = Join-Path $repoRoot $ProjectRelativePath
    if (-not (Test-Path -LiteralPath $fullPath)) {
        return @()
    }

    $content = Get-Content -LiteralPath $fullPath -Raw
    $references = @()

    foreach ($match in [regex]::Matches($content, '<ProjectReference\s+Include="([^"]+)"')) {
        $include = $match.Groups[1].Value
        $resolved = [System.IO.Path]::GetFullPath((Join-Path (Split-Path $fullPath -Parent) $include))
        $relative = Get-NormalizedProjectPath ([System.IO.Path]::GetRelativePath($repoRoot, $resolved))

        if ($relative -like "*.csproj") {
            $references += $relative
        }
    }

    return $references | Select-Object -Unique
}

function Add-ProjectScore {
    param(
        [hashtable] $Scores,
        [string] $ProjectRelativePath,
        [int] $Points
    )

    if ([string]::IsNullOrWhiteSpace($ProjectRelativePath)) {
        return
    }

    $normalized = Get-NormalizedProjectPath $ProjectRelativePath
    if (-not $normalized.EndsWith(".csproj", [StringComparison]::OrdinalIgnoreCase)) {
        return
    }

    if (-not $Scores.ContainsKey($normalized)) {
        $Scores[$normalized] = 0
    }

    $Scores[$normalized] += $Points
}

function Resolve-ProjectForSourceFile {
    param([string] $SourceRelativePath)

    $fullPath = Join-Path $repoRoot $SourceRelativePath
    $directory = Split-Path $fullPath -Parent

    while ($directory.StartsWith($repoRoot, [StringComparison]::OrdinalIgnoreCase)) {
        $candidate = Get-ChildItem -LiteralPath $directory -Filter "*.csproj" -File -ErrorAction SilentlyContinue |
            Where-Object { $_.Name -notlike "*.Tests.csproj" } |
            Select-Object -First 1

        if ($null -ne $candidate) {
            return Get-NormalizedProjectPath (
                [System.IO.Path]::GetRelativePath($repoRoot, $candidate.FullName)
            )
        }

        $parent = Split-Path $directory -Parent
        if ([string]::IsNullOrWhiteSpace($parent) -or $parent -eq $directory) {
            break
        }

        $directory = $parent
    }

    return $null
}

function Get-TestProjectFor {
    param([string] $ProjectRelativePath)

    $directoryName = Get-ProjectDirectoryName $ProjectRelativePath
    $testProject = Get-NormalizedProjectPath (
        (Join-Path (Split-Path $ProjectRelativePath -Parent) ($directoryName + ".Tests.csproj"))
    )

    if (Test-Path -LiteralPath (Join-Path $repoRoot $testProject)) {
        return $testProject
    }

    return $null
}

# Score projects from git history and recent local edits.
$scores = @{}

if (Get-Command git -ErrorAction SilentlyContinue) {
    $since = (Get-Date).AddDays(-1 * $Days).ToString("yyyy-MM-dd")
    $gitFiles = git -C $repoRoot log --since=$since --name-only --pretty=format: 2>$null |
        Where-Object { $_ -and $_.Trim() -ne "" }

    foreach ($file in $gitFiles) {
        $normalizedFile = Get-NormalizedProjectPath $file

        if ($normalizedFile -like "*.csproj") {
            Add-ProjectScore -Scores $scores -ProjectRelativePath $normalizedFile -Points 8
            continue
        }

        if ($normalizedFile -notlike "*.cs") {
            continue
        }

        $project = Resolve-ProjectForSourceFile -SourceRelativePath $normalizedFile
        if ($null -ne $project) {
            Add-ProjectScore -Scores $scores -ProjectRelativePath $project -Points 5
        }
    }
}

$cutoff = (Get-Date).AddDays(-1 * [Math]::Min($Days, 7))
$projectRoots = Get-ChildItem -Path $repoRoot -Directory -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -like "ArchLucid*" -or $_.Name -eq "archlucid-ui" }

foreach ($rootDir in $projectRoots) {
    Get-ChildItem -Path $rootDir.FullName -Recurse -File -Include *.cs,*.csproj -ErrorAction SilentlyContinue |
        Where-Object {
            $_.LastWriteTime -ge $cutoff -and
            $_.FullName -notmatch "\\(bin|obj|node_modules|coverage|infra|\\.git)\\"
        } |
        ForEach-Object {
        $relative = Get-NormalizedProjectPath ([System.IO.Path]::GetRelativePath($repoRoot, $_.FullName))

        if ($relative -like "*.csproj") {
            Add-ProjectScore -Scores $scores -ProjectRelativePath $relative -Points 4
            return
        }

        if ($relative -like "*.cs") {
            $project = Resolve-ProjectForSourceFile -SourceRelativePath $relative
            if ($null -ne $project) {
                Add-ProjectScore -Scores $scores -ProjectRelativePath $project -Points 2
            }
        }
    }
}

# Shared hub projects â€” almost every area touches these.
$hubProjects = @(
    "ArchLucid.Contracts/ArchLucid.Contracts.csproj",
    "ArchLucid.Core/ArchLucid.Core.csproj",
    "ArchLucid.Application/ArchLucid.Application.csproj",
    "ArchLucid.TestSupport/ArchLucid.TestSupport.csproj"
)

foreach ($hub in $hubProjects) {
    Add-ProjectScore -Scores $scores -ProjectRelativePath $hub -Points 1000
}

$seedProjects = $scores.GetEnumerator() |
    Sort-Object -Property @{ Expression = { -1 * $_.Value } }, Key |
    Select-Object -First 8 |
    ForEach-Object { $_.Key }

$selected = [System.Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)

foreach ($project in $hubProjects) {
    if (Test-Path -LiteralPath (Join-Path $repoRoot $project)) {
        [void] $selected.Add($project)
    }
}

foreach ($seed in $seedProjects) {
    if ($selected.Count -ge $MaxProjects) {
        break
    }

    [void] $selected.Add($seed)

    $testProject = Get-TestProjectFor -ProjectRelativePath $seed
    if ($null -ne $testProject) {
        [void] $selected.Add($testProject)
    }

    foreach ($reference in Get-ProjectReferences -ProjectRelativePath $seed) {
        if ($selected.Count -ge $MaxProjects) {
            break
        }

        [void] $selected.Add($reference)

        $referenceTest = Get-TestProjectFor -ProjectRelativePath $reference
        if ($null -ne $referenceTest) {
            [void] $selected.Add($referenceTest)
        }
    }
}

$projects = $selected |
    Where-Object { Test-Path -LiteralPath (Join-Path $repoRoot $_) } |
    Sort-Object

if ($projects.Count -eq 0) {
    throw "No projects selected. Edit ArchLucid.Core.slnf manually or widen -Days."
}

$slnf = [ordered]@{
    solution = [ordered]@{
        path = "ArchLucid.sln"
        projects = @($projects)
    }
}

$outputPath = Join-Path $repoRoot $OutputFileName
$json = ($slnf | ConvertTo-Json -Depth 5)
[System.IO.File]::WriteAllText($outputPath, $json + [Environment]::NewLine)

Write-Host "Wrote $outputPath with $($projects.Count) projects:"
$projects | ForEach-Object { Write-Host "  $_" }