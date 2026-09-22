using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
/// SN-018 ratchet: sealed records open as nested architecture children with desk back navigation (ADR 0077).
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class SystemNotJobSn018SealedChildNotSecondDeskArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void Sn018_module_names_desk_sealed_child_resolvers()
    {
        string module = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "system-not-job-sealed-child-not-second-desk.ts"));

        module.Should().Contain("resolveSystemNotJobDeskSealedChildReviewHref");
        module.Should().Contain("SYSTEM_NOT_JOB_DESK_SEALED_CHILD_LINK_ROWS");
        module.Should().Contain("SN-018");
        module.Should().Contain("0077");
    }

    [Fact]
    public void Sn018_nested_chrome_exposes_back_to_architecture_desk()
    {
        string chrome = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "components",
                "architecture",
                "WorkingNestedArchitectureIdentityChrome.tsx"));

        chrome.Should().Contain("SYSTEM_NOT_JOB_SEALED_CHILD_BACK_DOM_TEST_ID");
        chrome.Should().Contain("SYSTEM_NOT_JOB_SEALED_CHILD_BACK_LABEL");
    }

    [Fact]
    public void Sn018_vitest_ratchet_names_nested_sealed_child_and_back_label()
    {
        string test = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "system-not-job-sealed-child-not-second-desk.test.ts"));

        test.Should().Contain("SN-018");
        test.Should().Contain("nests desk sealed-child review href");
        test.Should().Contain("Back to architecture desk");
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
