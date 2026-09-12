using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
/// SN-003 ratchet: spawn-locked draft URLs show snapshot honesty and clone CTA (WA-10).
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class SystemNotJobSn003SpawnLockDraftUrlHonestyArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void Sn003_honesty_module_declares_snapshot_and_clone_copy()
    {
        string honesty = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "architecture", "architecture-draft-spawn-lock-url-honesty.ts"));

        honesty.Should().Contain("ARCHITECTURE_DRAFT_SPAWN_LOCK_SNAPSHOT_SENTENCE");
        honesty.Should().Contain("legal new version");
        honesty.Should().Contain("resolveArchitectureDraftSpawnLockWorkspaceLead");
    }

    [Fact]
    public void Sn003_handoff_surfaces_wire_snapshot_honesty_and_clone_control()
    {
        string panel = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "architecture", "ArchitectureDraftHandoffPanel.tsx"));
        string banner = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "architecture", "ArchitectureDraftHandoffBanner.tsx"));
        string vitest = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "system-not-job-spawn-lock-draft-url-honesty.test.ts"));

        panel.Should().Contain("data-spawn-lock-url-honesty");
        panel.Should().Contain("ArchitectureDraftCloneSnapshotControl");
        banner.Should().Contain("data-spawn-lock-url-honesty");
        vitest.Should().Contain("SN-003");
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
