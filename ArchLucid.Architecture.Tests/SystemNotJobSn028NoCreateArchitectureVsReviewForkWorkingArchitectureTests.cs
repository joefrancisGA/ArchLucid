using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
/// SN-028 ratchet: Working nav collapses create-vs-review fork to one sequence verb (ADR 0069).
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class SystemNotJobSn028NoCreateArchitectureVsReviewForkWorkingArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void Sn028_module_names_single_start_resolver_and_banned_peer_labels()
    {
        string module = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "system-not-job-no-create-architecture-vs-review-fork-working.ts"));

        module.Should().Contain("resolveWorkingSingleStartNavPresentation");
        module.Should().Contain("WORKING_NAV_BANNED_PEER_START_LABELS");
        module.Should().Contain("WORKING_NEW_REVIEW_LABEL");
        module.Should().Contain("SN-028");
    }

    [Fact]
    public void Sn028_operator_nav_labels_wires_working_single_start_presentation()
    {
        string navLabels = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "operator", "operator-nav-labels.ts"));

        navLabels.Should().Contain("resolveWorkingSingleStartNavPresentation");
        navLabels.Should().Contain("WORKING_SINGLE_START_NAV_TOOLTIP");
    }

    [Fact]
    public void Sn028_vitest_ratchet_names_working_collapse_and_guided_peer_parity()
    {
        string test = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "system-not-job-no-create-architecture-vs-review-fork-working.test.ts"));

        test.Should().Contain("SN-028");
        test.Should().Contain("WORKING_NEW_REVIEW_LABEL");
        test.Should().Contain("keeps Guided buyer-polished peer labels");
        test.Should().Contain("0069");
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
