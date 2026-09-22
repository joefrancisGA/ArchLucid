using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>AS-078 ratchet: Career door cannot launder Simulator execute as career proof.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureSpineAs078CareerDoorRequiresRealOrBlockedArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    private const string GateModuleRelativePath =
        "archlucid-ui/src/lib/governance/working-career-door-gate.ts";

    private const string ChooserRelativePath =
        "archlucid-ui/src/components/workspace-mode/WorkingCareerRehearsalChooser.tsx";

    private const string BlockedDialogRelativePath =
        "archlucid-ui/src/components/workspace-mode/WorkingCareerDoorBlockedDialog.tsx";

    [Fact]
    public void As078_gate_blocks_career_on_simulator_host_and_resolves_effective_rehearsal()
    {
        string gateModule = File.ReadAllText(Path.Combine(RepoRoot, GateModuleRelativePath));

        gateModule.Should().Contain("resolveWorkingCareerDoorGate");
        gateModule.Should().Contain("resolveEffectiveWorkingCareerRehearsalDoor");
        gateModule.Should().Contain("host-simulator-pinned");
        gateModule.Should().Contain("live-ai-not-ready");
        gateModule.Should().Contain("TB-1299");
    }

    [Fact]
    public void As078_chooser_wires_gate_and_blocked_dialog()
    {
        string chooser = File.ReadAllText(Path.Combine(RepoRoot, ChooserRelativePath));

        chooser.Should().Contain("useWorkingCareerDoorGate");
        chooser.Should().Contain("WorkingCareerDoorBlockedDialog");
        chooser.Should().Contain("data-effective-door");
        chooser.Should().Contain("resolveWorkingCareerDoorHostModeMatrixCell");
        chooser.Should().Contain("data-door-host-mode-cell");
    }

    [Fact]
    public void As078_blocked_dialog_offers_rehearsal_and_platform_settings_ctas()
    {
        string dialog = File.ReadAllText(Path.Combine(RepoRoot, BlockedDialogRelativePath));

        dialog.Should().Contain("WORKING_CAREER_DOOR_SWITCH_TO_REHEARSAL_ACTION");
        dialog.Should().Contain("WORKING_CAREER_DOOR_OPEN_PLATFORM_SETTINGS_ACTION");
        dialog.Should().Contain("working-career-door-blocked-dialog");
    }

    private static string FindRepoRoot()
    {
        DirectoryInfo? dir = new(AppContext.BaseDirectory);

        while (dir is not null)
        {
            if (File.Exists(Path.Combine(dir.FullName, "ArchLucid.sln")))
                return dir.FullName;

            dir = dir.Parent;
        }

        throw new InvalidOperationException("Could not locate repo root (ArchLucid.sln).");
    }
}
