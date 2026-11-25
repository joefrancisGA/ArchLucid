#Requires -Version 5.1
# Pure helpers for scripts/cleanup-agent-worktrees.ps1 (Pester-tested).

Set-StrictMode -Version Latest

function ConvertTo-NormalizedGitPath {
    param(
        [Parameter(Mandatory = $true)]
        [string] $Path
    )

    return ([System.IO.Path]::GetFullPath($Path)).TrimEnd('\', '/').ToLowerInvariant()
}

function Test-IsAgentEphemeralWorktreePath {
    param(
        [Parameter(Mandatory = $true)]
        [string] $WorktreePath,

        [Parameter(Mandatory = $true)]
        [string] $PrimaryRepoRoot
    )

    $normalizedPrimary = ConvertTo-NormalizedGitPath -Path $PrimaryRepoRoot
    $normalizedPath = ConvertTo-NormalizedGitPath -Path $WorktreePath

    if ($normalizedPath -eq $normalizedPrimary) {
        return $false
    }

    $leaf = [System.IO.Path]::GetFileName($WorktreePath)

    if ($leaf -match '^(?i)archlucid-pr-\d+$') {
        return $true
    }

    if ($WorktreePath -match '(?i)[/\\]ArchLucid-al-bug') {
        return $true
    }

    if ($WorktreePath -match '(?i)[/\\]\.worktrees[/\\]') {
        return $true
    }

    if ($WorktreePath -match '(?i)al-bug-push-') {
        return $true
    }

    return $false
}

function Test-IsAgentTempCloneDirectoryName {
    param(
        [Parameter(Mandatory = $true)]
        [string] $Name
    )

    if ($Name -match '^(?i)al-bug-') {
        return $true
    }

    if ($Name -match '^(?i)archlucid-.+-clone$') {
        return $true
    }

    if ($Name -match '^(?i)archlucid-round\d+') {
        return $true
    }

    return $false
}

function ConvertFrom-GitWorktreePorcelain {
    param(
        [Parameter(Mandatory = $true)]
        [string] $Porcelain
    )

    [System.Collections.Generic.List[object]] $entries = [System.Collections.Generic.List[object]]::new()
    $currentPath = $null
    $currentBranch = $null
    $isLocked = $false
    $lockReason = $null

    foreach ($line in ($Porcelain -split "`r?`n")) {
        if ([string]::IsNullOrWhiteSpace($line)) {
            if ($null -ne $currentPath) {
                $entries.Add([PSCustomObject]@{
                        Path       = $currentPath
                        Branch     = $currentBranch
                        IsLocked   = $isLocked
                        LockReason = $lockReason
                    })
            }

            $currentPath = $null
            $currentBranch = $null
            $isLocked = $false
            $lockReason = $null
            continue
        }

        if ($line.StartsWith('worktree ')) {
            $currentPath = $line.Substring('worktree '.Length).Trim()
            continue
        }

        if ($line.StartsWith('branch ')) {
            $currentBranch = $line.Substring('branch '.Length).Trim()
            continue
        }

        if ($line.StartsWith('locked ')) {
            $isLocked = $true
            $lockReason = $line.Substring('locked '.Length).Trim()
        }
    }

    if ($null -ne $currentPath) {
        $entries.Add([PSCustomObject]@{
                Path       = $currentPath
                Branch     = $currentBranch
                IsLocked   = $isLocked
                LockReason = $lockReason
            })
    }

    return @($entries)
}

function Get-AgentEphemeralWorktreesFromPorcelain {
    param(
        [Parameter(Mandatory = $true)]
        [string] $Porcelain,

        [Parameter(Mandatory = $true)]
        [string] $PrimaryRepoRoot
    )

    $entries = ConvertFrom-GitWorktreePorcelain -Porcelain $Porcelain

    return @(
        $entries |
            Where-Object { Test-IsAgentEphemeralWorktreePath -WorktreePath $_.Path -PrimaryRepoRoot $PrimaryRepoRoot }
    )
}

function Resolve-GitRepositoryRootFromScript {
    param(
        [Parameter(Mandatory = $true)]
        [string] $StartingDirectory
    )

    $topLevel = (git -C $StartingDirectory rev-parse --show-toplevel 2>$null)

    if (-not [string]::IsNullOrWhiteSpace($topLevel)) {
        return $topLevel.Trim()
    }

    throw "Could not locate git repository root from $StartingDirectory"
}