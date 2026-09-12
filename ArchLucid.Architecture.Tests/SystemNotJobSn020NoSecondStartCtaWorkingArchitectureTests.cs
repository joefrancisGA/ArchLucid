using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
/// SN-020 ratchet: Working Home has one start verb — no peer Create vs Start review CTAs (ADR 0069).
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class SystemNotJobSn020NoSecondStartCtaWorkingArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void Sn020_module_names_single_start_label_and_banned_peer_products()
    {
        string module = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "system-not-job-no-second-start-cta-working.ts"));

        module.Should().Contain("resolveWorkingHomeSingleStartPrimaryLabel");
        module.Should().Contain("WORKING_HOME_BANNED_PEER_START_LABELS");
        module.Should().Contain("WORKING_NEW_REVIEW_LABEL");
        module.Should().Contain("SN-020");
    }

    [Fact]
    public void Sn020_working_home_primary_cta_wires_sn020_resolvers()
    {
        string workingPrimary = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "components",
                "operator-home",
                "OperatorHomeWorkingPrimaryCta.tsx"));

        workingPrimary.Should().Contain("resolveWorkingHomeSingleStartPrimaryLabel");
        workingPrimary.Should().Contain("resolveWorkingHomeNewReviewBridgeCopy");
        workingPrimary.Should().NotContain("START_REVIEW_LABEL");
    }

    [Fact]
    public void Sn020_vitest_ratchet_names_dual_path_guards_and_adr_0069()
    {
        string test = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "system-not-job-no-second-start-cta-working.test.ts"));

        test.Should().Contain("SN-020");
        test.Should().Contain("dual-path");
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
