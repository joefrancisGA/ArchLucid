using System.Text.Json;

using ArchLucid.Core.Findings;
using ArchLucid.Decisioning.Compliance.Models;
using ArchLucid.Decisioning.Models;
using ArchLucid.Decisioning.Services;
using ArchLucid.KnowledgeGraph.Models;
using ArchLucid.TestSupport.GoldenCorpus;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.GoldenCorpus;

/// <summary>
///     QR-18 / QR-19 / QR-25 / QR-27: golden graphs that those engines already traverse carry product-shaped
///     ARM/ARN so <see cref="GenericArchitectureAdvicePatterns.HasConcreteEvidenceCitation" /> is true.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class GoldenCorpusProductCitationTests
{
    [Fact]
    public async Task Case05_security_baseline_has_concrete_citation()
    {
        GraphSnapshot graph = await LoadGraphAsync("case-05");
        SecurityBaselineFindingEngine sut = new();

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(graph, null, CancellationToken.None);

        findings.Should().NotBeEmpty();
        AssertAllHaveConcreteCitation(findings);
    }

    [Fact]
    public async Task Case33_declaration_security_baseline_has_concrete_citation()
    {
        GraphSnapshot graph = await LoadGraphAsync("case-33");
        DeclarationSecurityBaselineFindingEngine sut = new(
            new FixedComplianceRulePackProvider(CreateFailOpenPolicyPack()));

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(graph, null, CancellationToken.None);

        findings.Should().NotBeEmpty();
        AssertAllHaveConcreteCitation(findings);
    }

    [Fact]
    public async Task Case38_identity_blast_radius_has_concrete_citation()
    {
        GraphSnapshot graph = await LoadGraphAsync("case-38");
        IdentityBlastRadiusFindingEngine sut = new();

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(graph, null, CancellationToken.None);

        findings.Should().NotBeEmpty();
        AssertAllHaveConcreteCitation(findings);
    }

    [Fact]
    public async Task Case39_segmentation_semantics_has_concrete_citation()
    {
        GraphSnapshot graph = await LoadGraphAsync("case-39");
        SegmentationSemanticsFindingEngine sut = new();

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(graph, null, CancellationToken.None);

        findings.Should().NotBeEmpty();
        AssertAllHaveConcreteCitation(findings);
    }

    [Fact]
    public async Task Case34_declaration_premise_conflict_has_concrete_citation()
    {
        GraphSnapshot graph = await LoadGraphAsync("case-34");
        DeclarationPremiseConflictFindingEngine sut = new(
            new FixedComplianceRulePackProvider(CreateFailOpenPolicyPack()));

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(graph, null, CancellationToken.None);

        IReadOnlyList<Finding> premiseFindings = findings
            .Where(finding => string.Equals(finding.EngineType, "declaration-premise-conflict", StringComparison.Ordinal))
            .ToList();

        premiseFindings.Should().NotBeEmpty();
        AssertAllHaveConcreteCitation(premiseFindings);
    }

    [Fact]
    public async Task Case40_dr_rpo_topology_has_concrete_citation()
    {
        GraphSnapshot graph = await LoadGraphAsync("case-40");
        DrRpoTopologyFindingEngine sut = new();

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(graph, null, CancellationToken.None);

        findings.Should().NotBeEmpty();
        AssertAllHaveConcreteCitation(findings);
    }

    [Fact]
    public async Task Case41_dangling_declaration_reference_has_concrete_citation()
    {
        GraphSnapshot graph = await LoadGraphAsync("case-41");
        DanglingDeclarationReferenceFindingEngine sut = new();

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(graph, null, CancellationToken.None);

        findings.Should().NotBeEmpty();
        AssertAllHaveConcreteCitation(findings);
    }

    [Fact]
    public async Task Case42_requirement_sku_tier_has_concrete_citation()
    {
        GraphSnapshot graph = await LoadGraphAsync("case-42");
        RequirementSkuTierFindingEngine sut = new();

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(graph, null, CancellationToken.None);

        findings.Should().NotBeEmpty();
        AssertAllHaveConcreteCitation(findings);
    }

    [Fact]
    public async Task Case45_dr_rpo_topology_second_has_concrete_citation()
    {
        GraphSnapshot graph = await LoadGraphAsync("case-45");
        DrRpoTopologyFindingEngine sut = new();

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(graph, null, CancellationToken.None);

        findings.Should().NotBeEmpty();
        AssertAllHaveConcreteCitation(findings);
    }

    [Fact]
    public async Task Case47_data_flow_trust_boundary_has_concrete_citation()
    {
        GraphSnapshot graph = await LoadGraphAsync("case-47");
        DataFlowTrustBoundaryFindingEngine sut = new();

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(graph, null, CancellationToken.None);

        findings.Should().NotBeEmpty();
        AssertAllHaveConcreteCitation(findings);
    }

    private static void AssertAllHaveConcreteCitation(IReadOnlyList<Finding> findings)
    {
        foreach (Finding finding in findings)
        {
            GenericArchitectureAdvicePatterns.HasConcreteEvidenceCitation(finding.EvidenceRefs)
                .Should()
                .BeTrue($"engine {finding.EngineType} finding '{finding.Title}' should cite ARM/ARN/diagram");
        }
    }

    private static async Task<GraphSnapshot> LoadGraphAsync(string caseFolderName)
    {
        string path = Path.Combine(GoldenCorpusRepoPaths.CorpusOutputDirectory, caseFolderName, "input.json");
        File.Exists(path).Should().BeTrue($"missing golden input {path}");

        string json = await File.ReadAllTextAsync(path);
        GoldenCorpusInputDocument? input =
            JsonSerializer.Deserialize<GoldenCorpusInputDocument>(json, GoldenCorpusJson.SerializerOptions);

        input.Should().NotBeNull();
        return input!.GraphSnapshot;
    }

    private static ComplianceRulePack CreateFailOpenPolicyPack() =>
        new()
        {
            RulePackId = "test-pack",
            Name = "Test",
            Version = "1",
            Rules =
            [
                new ComplianceRule
                {
                    RuleId = "cost-opt-001",
                    ControlId = "c",
                    ControlName = "n",
                    AppliesToCategory = "cat",
                    RequiredNodeType = "t",
                    RequiredEdgeType = "e",
                    Description = "d",
                },
            ],
        };
}
