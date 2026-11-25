#Requires -Version 7.0
# Run: Invoke-Pester -Strict -EnableExit -Path 'scripts/tests/CleanupAgentWorktrees.Tests.ps1'
Set-StrictMode -Version Latest

Describe 'cleanup-agent-worktrees.helpers.ps1' {
    BeforeAll {
        [string]$script:repoRoot = Split-Path -Parent $PSScriptRoot
        [string]$script:helpersPath = Join-Path $script:repoRoot 'cleanup-agent-worktrees.helpers.ps1'
        . $script:helpersPath
    }

    It 'keeps the primary repo root worktree' {
        [string]$primary = 'C:\archlucid\archlucid'
        Test-IsAgentEphemeralWorktreePath -WorktreePath $primary -PrimaryRepoRoot $primary | Should -Be $false
    }

    It 'marks archlucid-pr sibling worktrees ephemeral' {
        [string]$primary = 'C:\archlucid\archlucid'
        Test-IsAgentEphemeralWorktreePath -WorktreePath 'C:\archlucid\archlucid-pr-8046' -PrimaryRepoRoot $primary | Should -Be $true
    }

    It 'does not mark named pr worktrees ephemeral' {
        [string]$primary = 'C:\archlucid\archlucid'
        Test-IsAgentEphemeralWorktreePath -WorktreePath 'C:\archlucid\archlucid-pr-agent-worktree-cleanup' -PrimaryRepoRoot $primary | Should -Be $false
    }

    It 'marks al-bug push worktrees ephemeral' {
        [string]$primary = 'C:\archlucid\archlucid'
        Test-IsAgentEphemeralWorktreePath -WorktreePath 'C:\archlucid\ArchLucid-al-bug-fix\al-bug-push-18000be6' -PrimaryRepoRoot $primary | Should -Be $true
    }

    It 'detects agent temp clone directory names' {
        Test-IsAgentTempCloneDirectoryName -Name 'al-bug-revert-abc' | Should -Be $true
        Test-IsAgentTempCloneDirectoryName -Name 'archlucid-round134-clone' | Should -Be $true
        Test-IsAgentTempCloneDirectoryName -Name 'node_modules' | Should -Be $false
    }

    It 'parses git worktree porcelain and filters ephemeral entries' {
        [string]$porcelain = @"
worktree C:/archlucid/archlucid
HEAD abc
branch refs/heads/master

worktree C:/archlucid/archlucid-pr-7925
HEAD def
branch refs/heads/cursor/test-4156

worktree C:/archlucid/ArchLucid-al-bug-fix/al-bug-push-1
HEAD ghi
branch refs/heads/fix/al-bug-push-1
locked initializing

"@
        [object[]]$ephemeral = @(Get-AgentEphemeralWorktreesFromPorcelain -Porcelain $porcelain -PrimaryRepoRoot 'C:\archlucid\archlucid')
        $ephemeral.Count | Should -Be 2
        ($ephemeral | Where-Object { $_.Path -like '*al-bug-push-1*' }).IsLocked | Should -Be $true
    }
}
