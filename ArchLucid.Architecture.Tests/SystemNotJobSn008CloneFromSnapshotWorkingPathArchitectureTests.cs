using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
/// SN-008 ratchet: clone-from-snapshot is the Working desk architecture sketch path (ADR 0092).
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class SystemNotJobSn008CloneFromSnapshotWorkingPathArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void Sn008_entry_module_names_desk_cta_confirm_and_palette_discovery()
    {
        string module = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "system-not-job-clone-from-snapshot-entry.ts"));

        module.Should().Contain("SYSTEM_NOT_JOB_CLONE_FROM_SNAPSHOT_DESK_CTA_LABEL");
        module.Should().Contain("CHEAP_EXPLORATION_SKETCH_A_CHANGE_DESK_CTA_LABEL");
        module.Should().Contain("resolveSystemNotJobCloneFromSnapshotConfirmCopy");
        module.Should().Contain("CG door rules");
        module.Should().Contain("architecture-spawn-lock-clone-snapshot");
    }

    [Fact]
    public void Sn008_clone_control_wires_confirm_dialog_and_spawn_locked_desk_action()
    {
        string control = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "components",
                "architecture",
                "ArchitectureDraftCloneSnapshotControl.tsx"));

        control.Should().Contain("ArchitectureDraftCloneSnapshotConfirmDialog");
        control.Should().Contain("spawnLockedDeskAction");
        control.Should().Contain("SYSTEM_NOT_JOB_CLONE_FROM_SNAPSHOT_SPAWN_LOCK_DOM_TEST_ID");
    }

    [Fact]
    public void Sn008_palette_handler_exposes_clone_action_on_spawn_locked_surfaces()
    {
        string handlers = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "command-palette-handler-actions.ts"));
        string dom = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "command-palette-work-action-dom.ts"));
        string bridge = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "components",
                "shell",
                "CommandPaletteWorkActionBridge.tsx"));

        handlers.Should().Contain("action-clone-from-snapshot");
        handlers.Should().Contain("SYSTEM_NOT_JOB_PALETTE_CLONE_NEW_VERSION_HANDLER.label");
        dom.Should().Contain("queryVisibleSpawnLockCloneSnapshotControl");
        bridge.Should().Contain("COMMAND_PALETTE_CLONE_FROM_SNAPSHOT_EVENT");
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
