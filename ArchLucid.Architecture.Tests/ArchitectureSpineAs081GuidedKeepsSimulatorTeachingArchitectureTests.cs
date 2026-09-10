using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>AS-081 ratchet: Guided seat keeps Simulator teaching; Career/Rehearsal chooser is Working-only.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureSpineAs081GuidedKeepsSimulatorTeachingArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void As081_operator_modes_doc_states_guided_excludes_career_rehearsal_chooser()
    {
        string modesDoc = File.ReadAllText(Path.Combine(RepoRoot, "docs", "library", "OPERATOR_UI_EXPERIENCE_MODES.md"));

        modesDoc.Should().Contain("Guided");
        modesDoc.Should().Contain("No Career/Rehearsal chooser");
        modesDoc.Should().Contain("AS-081");
    }

    [Fact]
    public void As081_working_chooser_is_not_mounted_on_guided_layout()
    {
        string layout = File.ReadAllText(Path.Combine(RepoRoot, "archlucid-ui", "src", "app", "layout.tsx"));
        string chooser = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "governance", "WorkingCareerRehearsalChooser.tsx"));

        layout.Should().Contain("WorkingCareerRehearsalIntentProvider");
        chooser.Should().Contain("workingDesk");
        chooser.Should().Contain("return null");
    }

    [Fact]
    public void As081_vitest_matrix_requires_guided_without_career_door()
    {
        string vitest = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "governance", "working-career-rehearsal-chrome.test.ts"));

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
