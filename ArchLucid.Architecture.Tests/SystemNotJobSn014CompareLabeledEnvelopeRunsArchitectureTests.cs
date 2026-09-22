using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
/// SN-014 ratchet: Working Compare pickers list committed rehearsal-stamped envelope runs with door stamps (CG-057).
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class SystemNotJobSn014CompareLabeledEnvelopeRunsArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void Sn014_compare_labeled_envelope_module_names_picker_gate_and_stamps()
    {
        string module = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "system-not-job-compare-labeled-envelope-runs.ts"));

        module.Should().Contain("COMPARE_RUN_PICKERS_REQUIRE_COMMITTED_MANIFESTS");
        module.Should().Contain("isRunEligibleForComparePicker");
        module.Should().Contain("resolveCompareRunDoorStampLabel");
        module.Should().Contain("SN-014");
    }

    [Fact]
    public void Sn014_compare_pickers_section_requires_committed_manifests_in_working_mode()
    {
        string pickersSection = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "insights",
                "compare-two-reviews",
                "_sections",
                "CompareRunPickersSection.tsx"));

        pickersSection.Should().Contain("COMPARE_RUN_PICKERS_REQUIRE_COMMITTED_MANIFESTS");
        pickersSection.Should().NotContain("committedOnly={useBuyerFacingRunLabels}");
    }

    [Fact]
    public void Sn014_vitest_ratchet_names_inventory_allowed_journey_and_compare_api_run_ids()
    {
        string test = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "system-not-job-compare-labeled-envelope-runs.test.ts"));
        string inventory = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "system-not-job-compare-gate-inventory.ts"));

        test.Should().Contain("SN-014");
        test.Should().Contain("isHonestCompareApiRunId");
        inventory.Should().Contain("labeledEnvelopeVsSeal");
        inventory.Should().Contain("\"allowed\"");
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
