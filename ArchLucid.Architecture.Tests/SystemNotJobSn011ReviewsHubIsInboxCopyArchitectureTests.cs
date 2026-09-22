using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
/// SN-011 ratchet: Working reviews hub inbox copy — cross-architecture triage, desk resume (ADR 0079).
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class SystemNotJobSn011ReviewsHubIsInboxCopyArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void Sn011_inbox_copy_module_names_inbox_caption_and_alt_r()
    {
        string module = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "system-not-job-reviews-hub-inbox-copy.ts"));

        module.Should().Contain("SYSTEM_NOT_JOB_WORKING_REVIEWS_HUB_INBOX_CAPTION");
        module.Should().Contain("resolveSystemNotJobReviewsHubClaimDiscipline");
        module.Should().Contain("Alt+R");
        module.Should().Contain("SN-011");
    }

    [Fact]
    public void Sn011_reviews_hub_page_header_wires_working_inbox_caption()
    {
        string header = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "architecture",
                "reviews",
                "_sections",
                "ReviewsHubPageHeader.tsx"));

        header.Should().Contain("ReviewsHubWorkingInboxCaption");
        header.Should().Contain("resolveSystemNotJobReviewsHubClaimDiscipline");
    }

    [Fact]
    public void Sn011_vitest_ratchet_names_inbox_and_adr_0079()
    {
        string test = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "system-not-job-reviews-hub-inbox-copy.test.ts"));

        test.Should().Contain("SN-011");
        test.Should().Contain("cross-architecture");
        test.Should().Contain("0079");
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
