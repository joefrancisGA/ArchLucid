using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Findings.Payloads;
using ArchLucid.Decisioning.Analysis;
using ArchLucid.Decisioning.Services;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests;

[Trait("Category", "Unit")]
public sealed class TopologyWaveFindingEngineTests
{
    [Fact]
    public async Task RequirementExpectationFindingEngine_WhenThemesMissing_EmitsFinding()
    {
        GraphCoverageAnalyzer analyzer = new();
        RequirementExpectationFindingEngine engine = new(analyzer);
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "ctx-1",
                    NodeType = GraphNodeTypes.ContextSnapshot,
                    Label = "scope",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [ContextGraphPropertyKeys.RequiredCapabilities] = "identity|sso"
                    }
                },
                new GraphNode
                {
                    NodeId = "cmp-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "api",
                    Category = GraphTopologyCategories.Compute,
                    Properties = new()
                }
            ]
        };

        IReadOnlyList<Finding> findings = await engine.AnalyzeAsync(graph, CancellationToken.None);

        findings.Should().ContainSingle();
        findings[0].EngineType.Should().Be("requirement-expectation");
        findings[0].RelatedNodeIds.Should().Contain("cmp-1");
        findings[0].RelatedNodeIds.Should().Contain("ctx-1");
        RequirementExpectationFindingPayload? payload = findings[0].Payload as RequirementExpectationFindingPayload;
        payload.Should().NotBeNull();
        payload!.MissingThemes.Should().Contain("identity-access");
    }

    [Fact]
    public async Task SecurityBaselineExpectationFindingEngine_WhenCategoryUnprotected_EmitsFinding()
    {
        GraphCoverageAnalyzer analyzer = new();
        SecurityBaselineExpectationFindingEngine engine = new(analyzer);
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "cmp-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "api",
                    Category = GraphTopologyCategories.Compute,
                    Properties = new()
                }
            ]
        };

        IReadOnlyList<Finding> findings = await engine.AnalyzeAsync(graph, CancellationToken.None);

        findings.Should().ContainSingle();
        findings[0].EngineType.Should().Be("security-baseline-expectation");
        findings[0].RelatedNodeIds.Should().Contain("cmp-1");
        SecurityBaselineExpectationFindingPayload? payload =
            findings[0].Payload as SecurityBaselineExpectationFindingPayload;
        payload.Should().NotBeNull();
        payload!.MissingCategories.Should().NotBeEmpty();
    }

    [Fact]
    public async Task SecurityBaselineCompletenessFindingEngine_WhenFamiliesMissing_EmitsFinding()
    {
        GraphCoverageAnalyzer analyzer = new();
        SecurityBaselineCompletenessFindingEngine engine = new(analyzer);
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "ctx-1",
                    NodeType = GraphNodeTypes.ContextSnapshot,
                    Label = "scope",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [ContextGraphPropertyKeys.RequiredCapabilities] = "identity|sso"
                    }
                },
                new GraphNode
                {
                    NodeId = "cmp-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "api",
                    Category = GraphTopologyCategories.Compute,
                    Properties = new()
                }
            ]
        };

        IReadOnlyList<Finding> findings = await engine.AnalyzeAsync(graph, CancellationToken.None);

        findings.Should().ContainSingle();
        findings[0].EngineType.Should().Be("security-baseline-completeness");
        findings[0].RelatedNodeIds.Should().Contain("cmp-1");
        findings[0].RelatedNodeIds.Should().Contain("ctx-1");
        SecurityBaselineCompletenessFindingPayload? payload =
            findings[0].Payload as SecurityBaselineCompletenessFindingPayload;
        payload.Should().NotBeNull();
        payload!.MissingControlFamilies.Should().Contain(SecurityControlFamilies.IdentityAccess);
        payload.CompletenessMatrix.Should().Contain(row =>
            row.ControlFamily == SecurityControlFamilies.IdentityAccess
            && row.Expected
            && !row.Present);
    }
}
