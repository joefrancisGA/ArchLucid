using ArchLucid.Capabilities.Cost;
using ArchLucid.Contracts.Findings;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

using FluentAssertions;

namespace ArchLucid.Capabilities.Cost.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class CostPolicyExpectationFindingEngineTests
{
    private readonly CostConstraintFindingEngine _constraintEngine = new();
    private readonly CostBreachFindingEngine _breachEngine = new();

    [Fact]
    public async Task Cost_constraint_emits_policy_required_cap_when_stamped_and_no_cap_node()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "context-1",
                    NodeType = GraphNodeTypes.ContextSnapshot,
                    Label = "scope",
                    Properties = new()
                    {
                        [ContextGraphPropertyKeys.PolicyCostRequireBudgetCap] = "true",
                    },
                },
                new GraphNode
                {
                    NodeId = "topo-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "app",
                    Category = GraphTopologyCategories.Compute,
                    Properties = new(),
                },
            ],
        };

        IReadOnlyList<Finding> findings = await _constraintEngine.AnalyzeAsync(graph, CancellationToken.None);

        Finding finding = findings.Should().ContainSingle().Subject;
        finding.Title.Should().Be("Policy requires a monthly budget cap");
        finding.Severity.Should().Be(FindingSeverity.Warning);
    }

    [Fact]
    public async Task Cost_constraint_no_required_cap_finding_when_cap_present()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "context-1",
                    NodeType = GraphNodeTypes.ContextSnapshot,
                    Label = "scope",
                    Properties = new()
                    {
                        [ContextGraphPropertyKeys.PolicyCostRequireBudgetCap] = "true",
                    },
                },
                new GraphNode
                {
                    NodeId = "topo-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "app",
                    Category = GraphTopologyCategories.Compute,
                    Properties = new(),
                },
                new GraphNode
                {
                    NodeId = "cost-1",
                    NodeType = "CostConstraint",
                    Label = "budget",
                    Properties = new() { ["maxMonthlyCost"] = "5000" },
                },
            ],
        };

        IReadOnlyList<Finding> findings = await _constraintEngine.AnalyzeAsync(graph, CancellationToken.None);

        findings.Should().ContainSingle();
        findings[0].Title.Should().StartWith("Cost constraint:");
    }

    [Fact]
    public async Task Cost_breach_uses_critical_severity_when_stamped()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "context-1",
                    NodeType = GraphNodeTypes.ContextSnapshot,
                    Label = "scope",
                    Properties = new()
                    {
                        [ContextGraphPropertyKeys.PolicyCostBreachSeverity] = "Critical",
                    },
                },
                new GraphNode
                {
                    NodeId = "cost-1",
                    NodeType = "CostConstraint",
                    Label = "budget",
                    Properties = new()
                    {
                        ["maxMonthlyCost"] = "5000",
                        ["projectedImpactUsdUpperBound"] = "6200",
                    },
                },
            ],
        };

        IReadOnlyList<Finding> findings = await _breachEngine.AnalyzeAsync(graph, CancellationToken.None);

        findings.Should().ContainSingle().Which.Severity.Should().Be(FindingSeverity.Critical);
    }

    [Fact]
    public async Task Cost_breach_clamps_info_stamp_to_warning()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "context-1",
                    NodeType = GraphNodeTypes.ContextSnapshot,
                    Label = "scope",
                    Properties = new()
                    {
                        [ContextGraphPropertyKeys.PolicyCostBreachSeverity] = "Info",
                    },
                },
                new GraphNode
                {
                    NodeId = "cost-1",
                    NodeType = "CostConstraint",
                    Label = "budget",
                    Properties = new()
                    {
                        ["maxMonthlyCost"] = "5000",
                        ["projectedImpactUsdUpperBound"] = "6200",
                    },
                },
            ],
        };

        IReadOnlyList<Finding> findings = await _breachEngine.AnalyzeAsync(graph, CancellationToken.None);

        findings.Should().ContainSingle().Which.Severity.Should().Be(FindingSeverity.Warning);
    }
}
