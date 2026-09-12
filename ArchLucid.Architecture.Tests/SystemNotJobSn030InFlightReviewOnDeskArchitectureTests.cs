using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
/// SN-030 ratchet: architecture desk child review rows show in-flight status with Activity links (PC-08).
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class SystemNotJobSn030InFlightReviewOnDeskArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void Sn030_module_names_child_review_resolver_and_background_wait_copy()
    {
        string module = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "system-not-job-in-flight-review-on-desk.ts"));

        module.Should().Contain("resolveSystemNotJobDeskChildReviewHref");
        module.Should().Contain("buildInFlightDeskHref");
        module.Should().Contain("SN-030");
        module.Should().Contain("cancel still asks for confirmation");
    }

    [Fact]
    public void Sn030_reviews_table_uses_in_flight_resolver_for_child_rows()
    {
        string reviewsTable = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "components",
                "architecture",
                "ArchitectureIdentityDeskReviewsTable.tsx"));

        reviewsTable.Should().Contain("resolveSystemNotJobDeskChildReviewHref");
        reviewsTable.Should().Contain("resolveSystemNotJobDeskChildReviewStatusLabel");
        reviewsTable.Should().Contain("useShellInFlightOperations");
    }

    [Fact]
    public void Sn030_in_flight_section_uses_desk_row_builder()
    {
        string inFlightSection = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "components",
                "architecture",
                "ArchitectureIdentityDeskInFlightSection.tsx"));

        inFlightSection.Should().Contain("buildSystemNotJobDeskInFlightDeskRows");
    }

    [Fact]
    public void Sn030_vitest_ratchet_names_activity_link_and_background_wait()
    {
        string test = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "system-not-job-in-flight-review-on-desk.test.ts"));

        test.Should().Contain("SN-030");
        test.Should().Contain("Activity");
        test.Should().Contain("stay on this page");
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
