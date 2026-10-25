using System.Globalization;

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

        IReadOnlyList<Finding> findings = await _sut.AnalyzeAsync(graph, null, CancellationToken.None);

        findings.Should().BeEmpty();
    }

    [Fact]
    public async Task AnalyzeAsync_prefers_projected_monthly_spend_over_impact_bounds()
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
                        ["maxMonthlyCost"] = "5000",
                        ["projectedMonthlySpendUsd"] = "4500",
                        ["projectedImpactUsdUpperBound"] = "6200"
                    }
                }
            ]
        };

        IReadOnlyList<Finding> findings = await _sut.AnalyzeAsync(graph, null, CancellationToken.None);

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

        IReadOnlyList<Finding> findings = await _sut.AnalyzeAsync(graph, null, CancellationToken.None);

        Finding finding = findings.Should().ContainSingle().Subject;
        finding.EngineType.Should().Be("cost-breach");
        finding.Severity.Should().Be(FindingSeverity.Error);
        CostBreachFindingPayload payload = finding.Payload.Should().BeOfType<CostBreachFindingPayload>().Subject;
        payload.MaxMonthlyCost.Should().Be(5000m);
        payload.ProjectedMonthlySpendUsd.Should().Be(6200m);
        payload.BreachAmountUsd.Should().Be(1200m);
    }

    [Fact]
    public async Task AnalyzeAsync_trims_padded_budget_name_on_breach_payload()
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
                        ["budgetName"] = " Prod ",
                        ["maxMonthlyCost"] = "5000",
                        ["projectedImpactUsdUpperBound"] = "6200",
                    }
                }
            ]
        };

        IReadOnlyList<Finding> findings = await _sut.AnalyzeAsync(graph, null, CancellationToken.None);

        CostBreachFindingPayload payload = findings.Should().ContainSingle().Subject.Payload
            .Should().BeOfType<CostBreachFindingPayload>().Subject;
        payload.BudgetName.Should().Be("Prod");
    }

    [Fact]
    public async Task AnalyzeAsync_trims_padded_label_in_breach_title()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "c1",
                    NodeType = "CostConstraint",
                    Label = " prod-budget ",
                    Properties = new Dictionary<string, string>
                    {
                        ["maxMonthlyCost"] = "5000",
                        ["projectedImpactUsdUpperBound"] = "6200",
                    }
                }
            ]
        };

        IReadOnlyList<Finding> findings = await _sut.AnalyzeAsync(graph, null, CancellationToken.None);

        findings.Should().ContainSingle().Subject.Title.Should().Be("Monthly cost breach: prod-budget");
    }

    [Fact]
    public async Task AnalyzeAsync_parses_invariant_graph_decimals_under_non_invariant_thread_culture()
    {
        CultureInfo previousCulture = CultureInfo.CurrentCulture;
        CultureInfo.CurrentCulture = new CultureInfo("fr-FR");

        try
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
                            ["maxMonthlyCost"] = "5000.00",
                            ["projectedImpactUsdUpperBound"] = "6200.50",
                        }
                    }
                ]
            };

            IReadOnlyList<Finding> findings = await _sut.AnalyzeAsync(graph, null, CancellationToken.None);

            Finding finding = findings.Should().ContainSingle().Subject;
            CostBreachFindingPayload payload = finding.Payload.Should().BeOfType<CostBreachFindingPayload>().Subject;
            payload.MaxMonthlyCost.Should().Be(5000.00m);
            payload.ProjectedMonthlySpendUsd.Should().Be(6200.50m);
            payload.BreachAmountUsd.Should().Be(1200.50m);
        }
        finally
        {
            CultureInfo.CurrentCulture = previousCulture;
        }
    }

    [Fact]
    public async Task AnalyzeAsync_parses_max_monthly_cost_with_leading_nbsp()
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
                        ["maxMonthlyCost"] = "\u00A05000",
                        ["projectedImpactUsdUpperBound"] = "6200",
                    }
                }
            ]
        };

        IReadOnlyList<Finding> findings = await _sut.AnalyzeAsync(graph, null, CancellationToken.None);

        findings.Should().ContainSingle();
    }

    [Fact]
    public async Task AnalyzeAsync_formats_trace_notes_in_usd_under_non_invariant_thread_culture()
    {
        CultureInfo previousCulture = CultureInfo.CurrentCulture;
        CultureInfo.CurrentCulture = new CultureInfo("fr-FR");

        try
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
                            ["maxMonthlyCost"] = "5000",
                            ["projectedImpactUsdUpperBound"] = "6200",
                        }
                    }
                ]
            };

            IReadOnlyList<Finding> findings = await _sut.AnalyzeAsync(graph, null, CancellationToken.None);

            Finding finding = findings.Should().ContainSingle().Subject;
            finding.Trace!.Notes.Should().Contain("Budget cap: $5,000/mo");
            finding.Trace.Notes.Should().Contain("Projected spend: $6,200/mo");
            finding.Trace.Notes.Should().Contain("Breach amount: $1,200/mo");
        }
        finally
        {
            CultureInfo.CurrentCulture = previousCulture;
        }
    }
}
