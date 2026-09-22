using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
/// SN-031 ratchet: spawn-locked draft fields stay non-writable; server PATCH blocked for RunSpawned (SN-004).
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class SystemNotJobSn031VitestSpawnLockNotWritableArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void Sn031_module_names_spawn_locked_fields_and_patch_blocked_copy()
    {
        string module = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "system-not-job-spawn-lock-not-writable.ts"));

        module.Should().Contain("SYSTEM_NOT_JOB_SPAWN_LOCKED_ARCHITECTURE_FIELD_TEST_IDS");
        module.Should().Contain("listSystemNotJobSpawnLockedDualEditorRows");
        module.Should().Contain("SN-031");
    }

    [Fact]
    public void Sn031_vitest_ratchet_disables_spawn_locked_fields_and_checks_patch_guard()
    {
        string test = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "system-not-job-spawn-lock-not-writable.test.tsx"));

        test.Should().Contain("SN-031");
        test.Should().Contain("spawn-locked");
        test.Should().Contain("toBeDisabled");
        test.Should().Contain("DraftPatchStaleUpdatedUtcGuard");
    }

    [Fact]
    public void Sn031_application_test_blocks_patch_on_run_spawned_status()
    {
        string applicationTest = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application.Tests",
                "Drafts",
                "DraftRequestSpawnLockPatchBlockedTests.cs"));

        applicationTest.Should().Contain("SN-031");
        applicationTest.Should().Contain("DraftRequestStatus.RunSpawned");
        applicationTest.Should().Contain("not mutable in status");
    }

    private static string FindRepoRoot()
    {
        DirectoryInfo? current = new(Directory.GetCurrentDirectory());

        while (current is not null)
        {
            if (File.Exists(Path.Combine(current.FullName, "ArchLucid.sln")))
            {
                return current.FullName;
            }

            current = current.Parent;
        }

        throw new InvalidOperationException("Could not find repository root containing ArchLucid.sln");
    }
}
