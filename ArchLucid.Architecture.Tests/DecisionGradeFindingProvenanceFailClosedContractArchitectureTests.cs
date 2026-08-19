using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>TB-1221: decision-grade finding provenance fail-closed contract artifacts stay wired.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class DecisionGradeFindingProvenanceFailClosedContractArchitectureTests
{
    private static readonly string RepoRoot = FindRepoRoot();

    [Fact]
    public void Tb1221_decision_grade_provenance_contract_exists()
    {
        string path = Path.Combine(RepoRoot, "docs", "library", "DECISION_GRADE_FINDING_PROVENANCE_FAIL_CLOSED_CONTRACT.md");

        File.Exists(path).Should().BeTrue();

        string text = File.ReadAllText(path);
        text.Should().Contain("TB-1221");
        text.Should().Contain("ProvenanceKind");
        text.Should().Contain("IFindingProvenanceValidator");
        text.Should().Contain("Checklist");
        text.Should().Contain("TB-1222");
        text.Should().Contain("EvidenceRefs");
    }

    [Fact]
    public void Tb1221_gtm_m208_section_and_alias_exist()
    {
        string packetPath = Path.Combine(RepoRoot, "docs", "go-to-market", "BUYER_SECURITY_PROCUREMENT_PACKET.md");
        string aliasPath = Path.Combine(
            RepoRoot,
            "docs",
            "go-to-market",
            "DECISION_GRADE_FINDING_PROVENANCE_FAIL_CLOSED_PA_ONE_PAGER.md");

        File.Exists(packetPath).Should().BeTrue();
        File.Exists(aliasPath).Should().BeTrue();

        string packet = File.ReadAllText(packetPath);
        packet.Should().Contain("decision-grade-finding-provenance-m-208");
        packet.Should().Contain("TB-1221");

        File.ReadAllText(aliasPath).Should().Contain("M-208");
    }

    [Fact]
    public void Tb1221_provenance_code_anchors_exist()
    {
        string[] paths =
        [
            Path.Combine(RepoRoot, "ArchLucid.Decisioning", "Services", "FindingPayloadValidator.cs"),
            Path.Combine(RepoRoot, "ArchLucid.Decisioning", "Services", "FindingsOrchestrator.cs"),
            Path.Combine(RepoRoot, "ArchLucid.AgentRuntime", "Evaluation", "FindingClaimCoverageEvaluator.cs"),
            Path.Combine(RepoRoot, "ArchLucid.Contracts", "Findings", "ArchitectureFinding.cs"),
        ];

        foreach (string path in paths)
            File.Exists(path).Should().BeTrue($"expected anchor {path}");
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
