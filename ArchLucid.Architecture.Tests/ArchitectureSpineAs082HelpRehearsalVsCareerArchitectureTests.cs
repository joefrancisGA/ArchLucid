using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>AS-082 ratchet: in-app help topic explains Career vs Rehearsal doors.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureSpineAs082HelpRehearsalVsCareerArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    private const string HelpGuideContentRelativePath =
        "archlucid-ui/src/lib/governance/working-career-rehearsal-help-guide-content.ts";

    private const string HelpGuideViewRelativePath =
        "archlucid-ui/src/app/(operator)/help/_sections/HelpWorkingCareerRehearsalGuideView.tsx";

    private const string ChooserRelativePath =
        "archlucid-ui/src/components/workspace-mode/WorkingCareerRehearsalChooser.tsx";

    [Fact]
    public void As082_help_content_names_career_and_rehearsal_doors()
    {
        string content = File.ReadAllText(Path.Combine(RepoRoot, HelpGuideContentRelativePath));

        content.Should().Contain("Career");
        content.Should().Contain("Rehearsal");
        content.Should().Contain("sponsor proof");
        content.Should().Contain("AS-082");
    }

    [Fact]
    public void As082_help_view_registers_career_rehearsal_door_tiles()
    {
        string view = File.ReadAllText(Path.Combine(RepoRoot, HelpGuideViewRelativePath));

        view.Should().Contain("HelpWorkingCareerRehearsalGuideView");
        view.Should().Contain("help-career-rehearsal-door-tile-career");
        view.Should().Contain("help-career-rehearsal-door-tile-rehearsal");
    }

    [Fact]
    public void As082_chooser_links_to_in_app_help_topic_not_github_blob()
    {
        string chooser = File.ReadAllText(Path.Combine(RepoRoot, ChooserRelativePath));

        chooser.Should().Contain("/help/career-rehearsal-doors");
        chooser.Should().NotContain("github.com");
        chooser.Should().NotContain("/blob/");
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
