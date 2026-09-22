using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
/// SN-006 ratchet: Compare gate inventory — two committed manifests; Working journeys that die here.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class SystemNotJobSn006CompareGateInventoryArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void Sn006_inventory_doc_names_compare_gate_and_journey_table()
    {
        string markdown = File.ReadAllText(
            Path.Combine(RepoRoot, "docs", "architecture", "SYSTEM_NOT_JOB_COMPARE_GATE_INVENTORY.md"));

        markdown.Should().Contain("AuthorityCompareService");
        markdown.Should().Contain("draftVsDraft");
        markdown.Should().Contain("SN-008");
        markdown.Should().Contain("golden manifests");
        markdown.Should().Contain("draft-to-draft Compare as Career proof");
    }

    [Fact]
    public void Sn006_inventory_module_lists_journeys_and_cheap_path_owner()
    {
        string inventory = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "system-not-job-compare-gate-inventory.ts"));
        string test = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "system-not-job-compare-gate-inventory.test.ts"));

        inventory.Should().Contain("SYSTEM_NOT_JOB_COMPARE_GATE_JOURNEYS");
        inventory.Should().Contain("draftVsDraft");
        inventory.Should().Contain("SYSTEM_NOT_JOB_COMPARE_GATE_CHEAP_PATH_OWNER");
        inventory.Should().Contain("SN-008");
        test.Should().Contain("SN-006");
        test.Should().Contain("bothRunsReadyForBranchCompare");
    }

    [Fact]
    public void Sn006_authority_compare_service_requires_golden_manifest_ids()
    {
        string compareService = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Persistence",
                "Coordination",
                "Compare",
                "AuthorityCompareService.cs"));

        compareService.Should().Contain("GoldenManifestId");
        compareService.Should().Contain("CompareManifestsAsync");
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
