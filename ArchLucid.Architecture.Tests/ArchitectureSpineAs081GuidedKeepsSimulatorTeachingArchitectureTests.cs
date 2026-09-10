using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
/// AS-081 ratchet: Career / Rehearsal chooser is Working-only; Guided keeps Simulator teaching chrome.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureSpineAs081GuidedKeepsSimulatorTeachingArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    private const string ChooserRelativePath =
        "archlucid-ui/src/components/workspace-mode/WorkingCareerRehearsalChooser.tsx";

    private const string GuidedTeachingInventoryRelativePath =
        "archlucid-ui/src/lib/workspace-mode/guided-teaching-chrome-inventory.ts";

    private const string OperatorExperienceModesDocRelativePath =
        "docs/library/OPERATOR_UI_EXPERIENCE_MODES.md";

    private const string SimulatorHonestyTestRelativePath =
        "archlucid-ui/src/lib/governance/simulator-career-honesty.test.ts";

    private const string WorkingCareerRehearsalChromeTestRelativePath =
        "archlucid-ui/src/lib/governance/working-career-rehearsal-chrome.test.ts";

    [Fact]
    public void As081_chooser_is_working_only_not_guided_teaching()
    {
        string chooser = File.ReadAllText(Path.Combine(RepoRoot, ChooserRelativePath));

        chooser.Should().Contain("isWorkingWorkspaceMode");
        chooser.Should().Contain("Hidden on Guided seats");
        chooser.Should().Contain("return null");
    }

    [Fact]
    public void As081_operator_modes_doc_states_guided_excludes_career_rehearsal_chooser()
    {
        string modesDoc = File.ReadAllText(Path.Combine(RepoRoot, OperatorExperienceModesDocRelativePath));

        modesDoc.Should().Contain("Guided");
        modesDoc.Should().Contain("No Career / Rehearsal chooser");
        modesDoc.Should().Contain("AS-081");
    }

    [Fact]
    public void As081_guided_teaching_inventory_excludes_career_rehearsal_chooser()
    {
        string inventory = File.ReadAllText(Path.Combine(RepoRoot, GuidedTeachingInventoryRelativePath));

        inventory.Should().NotContain("\"working-career-rehearsal-chooser\"");
        inventory.Should().NotContain("\"career-rehearsal-chooser\"");
        inventory.Should().Contain("AS-081");
        inventory.Should().Contain("Teaching chrome surfaces hidden when workspace mode is Working");
    }

    [Fact]
    public void As081_operator_experience_modes_doc_documents_career_rehearsal_split()
    {
        string doc = File.ReadAllText(Path.Combine(RepoRoot, OperatorExperienceModesDocRelativePath));

        doc.Should().Contain("Career");
        doc.Should().Contain("Rehearsal");
        doc.Should().Contain("AS-081");
        doc.Should().Contain("WorkingCareerRehearsalChooser");
    }

    [Fact]
    public void As081_simulator_honesty_tests_keep_guided_teaching_unblocked()
    {
        string simulatorHonestyTest = File.ReadAllText(Path.Combine(RepoRoot, SimulatorHonestyTestRelativePath));

        simulatorHonestyTest.Should().Contain("does not block guided simulator paths");
        simulatorHonestyTest.Should().Contain("workingDesk: false");
    }

    [Fact]
    public void As081_vitest_matrix_requires_guided_without_career_door()
    {
        string vitest = File.ReadAllText(Path.Combine(RepoRoot, WorkingCareerRehearsalChromeTestRelativePath));

        vitest.Should().Contain("AS-081 Guided mode must not require Working Career/Rehearsal chooser");
        vitest.Should().Contain("workspaceMode: \"guided\"");
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
