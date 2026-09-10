using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>AS-069 ratchet: Ask inherits weakest cited-finding semantic support band.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureSpineAs069AskInheritsBandArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void As069_ask_service_system_prompt_requires_weakest_band_inheritance()
    {
        string askService = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Host.Core", "Services", "Ask", "AskService.cs"));

        askService.Should().Contain("weakest semantic support band");
        askService.Should().Contain("TB-1003");
    }

    [Fact]
    public void As069_ask_user_prompt_composer_wires_band_index_constraint()
    {
        string composer = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Host.Core", "Services", "Ask", "AskUserPromptComposer.cs"));

        composer.Should().Contain("BuildPromptConstraintSection");
        composer.Should().Contain("findingBandIndex");
    }

    [Fact]
    public void As069_ui_footnote_component_exists_for_ask_thread()
    {
        string footnote = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "components",
                "ask",
                "AskCitedFindingsSemanticSupportBandFootnote.tsx"));
        string footnoteCopy = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "ask",
                "ask-cited-findings-semantic-support-band.ts"));

        footnote.Should().Contain("ask-cited-findings-semantic-support-band-footnote");
        footnoteCopy.Should().Contain("TB-1003");
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
