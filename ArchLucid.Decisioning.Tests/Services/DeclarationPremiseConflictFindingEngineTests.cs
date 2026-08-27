using ArchLucid.Contracts.Findings.Payloads;
using ArchLucid.Core.Findings;
using ArchLucid.Decisioning.Compliance.Models;
using ArchLucid.Decisioning.Models;
using ArchLucid.Decisioning.Services;
using ArchLucid.Decisioning.Tests.GoldenCorpus;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.Services;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class DeclarationPremiseConflictFindingEngineTests
{
    private readonly DeclarationPremiseConflictFindingEngine _sut =
        new(new FixedComplianceRulePackProvider(CreateFailOpenPolicyPack()));
    private readonly DeclarationSecurityBaselineFindingEngine _siblingEngine =
        new(new FixedComplianceRulePackProvider(CreateFailOpenPolicyPack()));

    [Fact]
    public async Task AnalyzeAsync_emits_error_for_private_baseline_and_public_declaration_on_narrow_edge()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "baseline-private",
                    NodeType = "SecurityBaseline",
                    Label = "Private only network access",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["description"] = "Private only network access required",
                    },
                },
                new GraphNode
                {
                    NodeId = "obj-storage",
                    NodeType = "TopologyResource",
                    Label = "docs",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["tf.public_network_access"] = "enabled",
                    },
                },
            ],
            Edges =
            [
                new GraphEdge
                {
                    FromNodeId = "baseline-private",
                    ToNodeId = "obj-storage",
                    EdgeType = "PROTECTS",
                    Weight = 0.9,
                },
            ],
        };

        IReadOnlyList<Finding> findings = await _sut.AnalyzeAsync(graph, CancellationToken.None);

        findings.Should().ContainSingle();
        findings[0].EngineType.Should().Be("declaration-premise-conflict");
        findings[0].Severity.Should().Be(FindingSeverity.Error);
        findings[0].Title.Should().Contain("conflicts with");
        findings[0].Rationale.Should().Contain("tf.public_network_access");
        findings[0].Rationale.Should().Contain("Private only network access required");
        findings[0].DecisionConsequence.Should().NotBeNullOrWhiteSpace();
        GenericArchitectureAdvicePatterns.HasFalsifiabilitySignal(findings[0].Title).Should().BeTrue();

        DeclarationPremiseConflictFindingPayload? payload =
            findings[0].Payload as DeclarationPremiseConflictFindingPayload;

        payload.Should().NotBeNull();
        payload!.ConflictKind.Should().Be("private-network-conflict");
        payload.IsNarrowApplicability.Should().BeTrue();
    }

    [Fact]
    public async Task AnalyzeAsync_emits_warning_on_graph_wide_fallback()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "baseline-private",
                    NodeType = "SecurityBaseline",
                    Label = "Private endpoint required",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["description"] = "Private endpoint required for storage",
                    },
                },
                new GraphNode
                {
                    NodeId = "obj-storage",
                    NodeType = "TopologyResource",
                    Label = "docs",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["tf.public_network_access"] = "enabled",
                    },
                },
            ],
        };

        IReadOnlyList<Finding> findings = await _sut.AnalyzeAsync(graph, CancellationToken.None);

        findings.Should().ContainSingle();
        findings[0].Severity.Should().Be(FindingSeverity.Warning);
        GenericArchitectureAdvicePatterns.HasFalsifiabilitySignal(findings[0].Title).Should().BeTrue();
    }

    [Fact]
    public async Task AnalyzeAsync_returns_empty_for_empty_graph()
    {
        IReadOnlyList<Finding> findings = await _sut.AnalyzeAsync(new GraphSnapshot(), CancellationToken.None);

        findings.Should().BeEmpty();
    }

    [Fact]
    public async Task AnalyzeAsync_does_not_change_sibling_declaration_security_baseline_output()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "baseline-private",
                    NodeType = "SecurityBaseline",
                    Label = "Private only network access",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["description"] = "Private only network access required",
                    },
                },
                new GraphNode
                {
                    NodeId = "obj-storage",
                    NodeType = "TopologyResource",
                    Label = "docs",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["tf.public_network_access"] = "enabled",
                    },
                },
            ],
            Edges =
            [
                new GraphEdge
                {
                    FromNodeId = "baseline-private",
                    ToNodeId = "obj-storage",
                    EdgeType = "PROTECTS",
                    Weight = 0.9,
                },
            ],
        };

        IReadOnlyList<Finding> siblingFindings = await _siblingEngine.AnalyzeAsync(graph, CancellationToken.None);

        siblingFindings.Should().ContainSingle();
        siblingFindings[0].FindingType.Should().Be("DeclarationSecurityBaselineFinding");
        siblingFindings[0].Title.Should().Contain("allows public network access");
        siblingFindings[0].Title.Should().NotContain("conflicts with");
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
