using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>AS-076 ratchet: ADR 0086 Career vs Rehearsal doors exists.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureSpineAs076CareerVsRehearsalDoorsArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    private const string AdrRelativePath =
        "docs/architecture/adrs/0086-career-vs-rehearsal-doors-no-host-mode-flip.md";

    [Fact]
    public void As076_adr_0086_exists_and_forbids_host_mode_flip()
    {
        string adr = File.ReadAllText(Path.Combine(RepoRoot, AdrRelativePath));

        adr.Should().Contain("Career");
        adr.Should().Contain("Rehearsal");
        adr.Should().Contain("AgentExecution:Mode");
        adr.Should().Contain("G-REAL-06");
    }

    [Fact]
    public void As076_working_chooser_component_exists()
    {
        string chooser = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "components",
                "governance",
                "WorkingCareerRehearsalChooser.tsx"));

        chooser.Should().Contain("working-career-rehearsal-chooser");
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
