using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>AS-076 ratchet: ADR 0086 Career vs Rehearsal doors without host Mode flip.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureSpineAs076CareerVsRehearsalDoorsArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    private const string AdrRelativePath =
        "docs/architecture/adrs/0086-working-career-vs-rehearsal-doors.md";

    private const string ReadmeRelativePath = "docs/architecture/adrs/README.md";

    [Fact]
    public void As076_adr_0086_exists_with_career_rehearsal_doors_and_required_sections()
    {
        string adrPath = Path.Combine(RepoRoot, AdrRelativePath);
        File.Exists(adrPath).Should().BeTrue();

        string adr = File.ReadAllText(adrPath);

        adr.Should().Contain("**Status:** Proposed");
        adr.Should().Contain("Career");
        adr.Should().Contain("Rehearsal");
        adr.Should().Contain("AgentExecution:Mode");
        adr.Should().Contain("## Trade-offs");
        adr.Should().Contain("## Constraints");
        adr.Should().Contain("## Expected impact");
        adr.Should().Contain("LP-06");
        adr.Should().Contain("0033");
    }

    [Fact]
    public void As076_adr_0086_forbids_host_mode_flip_and_g_real_06_implementation()
    {
        string adr = File.ReadAllText(Path.Combine(RepoRoot, AdrRelativePath));

        adr.Should().Contain("G-REAL-06");
        adr.Should().MatchRegex("not.*flip", "ADR must forbid silent host Mode flip");
        adr.Should().MatchRegex("not.*implement.*G-REAL-06", "ADR must not subsume G-REAL-06 owner program");
        adr.Should().Contain("simulator-career-honesty");
    }

    [Fact]
    public void As076_adr_0086_quoteable_working_career_while_mode_simulator_is_no()
    {
        string adr = File.ReadAllText(Path.Combine(RepoRoot, AdrRelativePath));

        adr.Should().Contain("May Working look like Career while `Mode=Simulator`?");
        adr.Should().Contain("**No**");
        adr.Should().Contain("unless the user is in the explicit **Rehearsal** door");
    }

    [Fact]
    public void As076_readme_lists_adr_0086_row()
    {
        string readme = File.ReadAllText(Path.Combine(RepoRoot, ReadmeRelativePath));

        readme.Should().Contain("0086-working-career-vs-rehearsal-doors.md");
        readme.Should().Contain("AS-076");
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
