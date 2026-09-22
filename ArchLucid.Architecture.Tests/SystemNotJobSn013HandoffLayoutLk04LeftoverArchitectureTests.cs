using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
/// SN-013 ratchet: spawn-locked draft layout is snapshot handoff + clone CTA, not a disabled editor (LK-04 leftover).
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class SystemNotJobSn013HandoffLayoutLk04LeftoverArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void Sn013_handoff_layout_module_names_gate_and_snapshot_summary()
    {
        string module = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "system-not-job-spawn-lock-handoff-layout.ts"));

        module.Should().Contain("shouldRenderSpawnLockedHandoffLayout");
        module.Should().Contain("resolveSpawnLockHandoffSnapshotSummaryRows");
        module.Should().Contain("SN-013");
    }

    [Fact]
    public void Sn013_handoff_panel_uses_snapshot_summary_and_clone_control()
    {
        string panel = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "components",
                "architecture",
                "ArchitectureDraftHandoffPanel.tsx"));

        panel.Should().Contain("ArchitectureDraftSpawnLockSnapshotSummary");
        panel.Should().Contain("ArchitectureDraftCloneSnapshotControl");
        panel.Should().Contain("SPAWN_LOCK_HANDOFF_LAYOUT_TEST_IDS.panel");
    }

    [Fact]
    public void Sn013_vitest_ratchet_names_handoff_layout_and_undo_window()
    {
        string test = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "system-not-job-spawn-lock-handoff-layout.test.ts"));

        test.Should().Contain("SN-013");
        test.Should().Contain("replaces disabled editor chrome");
        test.Should().Contain("MUTATION_UNDO_WINDOW_SECONDS");
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
