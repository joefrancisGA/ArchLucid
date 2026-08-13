using ArchLucid.Capabilities.Cost;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Findings.Payloads;
using ArchLucid.KnowledgeGraph.Models;

using FluentAssertions;

namespace ArchLucid.Capabilities.Cost.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class CostBreachFindingEngineTests
{
    private readonly CostBreachFindingEngine _sut = new();

    [Fact]
    public async Task AnalyzeAsync_returns_empty_when_projected_spend_is_within_cap()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "c1",
                    NodeType = "CostConstraint",
                    Label = "budget",
                    Properties = new Dictionary<string, string>
                    {
                        ["maxMonthlyCost"] = "5000",
                        ["projectedImpactUsdUpperBound"] = "4500"
                    }
                }
            ]
        };

        IReadOnlyList<Finding> findings = await _sut.AnalyzeAsync(graph, CancellationToken.None);

        findings.Should().BeEmpty();
    }

    [Fact]
    public async Task AnalyzeAsync_emits_breach_when_upper_bound_exceeds_cap()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "c1",
                    NodeType = "CostConstraint",
                    Label = "prod-budget",
                    Properties = new Dictionary<string, string>
                    {
                        ["budgetName"] = "Prod",
                        ["maxMonthlyCost"] = "5000",
                        ["projectedImpactUsdUpperBound"] = "6200",
                        ["projectedImpactUsdLowerBound"] = "5800"
                    }
                }
            ]
        };

        IReadOnlyList<Finding> findings = await _sut.AnalyzeAsync(graph, CancellationToken.None);

        Finding finding = findings.Should().ContainSingle().Subject;
        finding.EngineType.Should().Be("cost-breach");
        finding.Severity.Should().Be(FindingSeverity.Error);
        CostBreachFindingPayload payload = finding.Payload.Should().BeOfType<CostBreachFindingPayload>().Subject;
        payload.MaxMonthlyCost.Should().Be(5000m);
        payload.ProjectedMonthlySpendUsd.Should().Be(6200m);
        payload.BreachAmountUsd.Should().Be(1200m);
    }
}
