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
    public async Task AnalyzeAsync_emits_breach_when_max_monthly_cost_has_trailing_currency_suffix()
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
                        ["maxMonthlyCost"] = "5000 USD",
                        ["projectedImpactUsdUpperBound"] = "6200",
                    }
                }
            ]
        };

        IReadOnlyList<Finding> findings = await _sut.AnalyzeAsync(graph, null, CancellationToken.None);

        Finding finding = findings.Should().ContainSingle().Subject;
        CostBreachFindingPayload payload = finding.Payload.Should().BeOfType<CostBreachFindingPayload>().Subject;
        payload.MaxMonthlyCost.Should().Be(5000m);
        payload.ProjectedMonthlySpendUsd.Should().Be(6200m);
    }

    [Fact]
    public async Task AnalyzeAsync_emits_breach_when_max_monthly_cost_has_leading_dollar_sign()
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
                        ["maxMonthlyCost"] = "$5000",
                        ["projectedImpactUsdUpperBound"] = "6200",
                    }
                }
            ]
        };

        IReadOnlyList<Finding> findings = await _sut.AnalyzeAsync(graph, null, CancellationToken.None);

        Finding finding = findings.Should().ContainSingle().Subject;
        CostBreachFindingPayload payload = finding.Payload.Should().BeOfType<CostBreachFindingPayload>().Subject;
        payload.MaxMonthlyCost.Should().Be(5000m);
        payload.ProjectedMonthlySpendUsd.Should().Be(6200m);
    }

    [Fact]
    public async Task AnalyzeAsync_emits_breach_when_max_monthly_cost_uses_accounting_parentheses()
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
                        ["maxMonthlyCost"] = "($5000)",
                        ["projectedImpactUsdUpperBound"] = "6200",
                    }
                }
            ]
        };

        IReadOnlyList<Finding> findings = await _sut.AnalyzeAsync(graph, null, CancellationToken.None);

        Finding finding = findings.Should().ContainSingle().Subject;
        CostBreachFindingPayload payload = finding.Payload.Should().BeOfType<CostBreachFindingPayload>().Subject;
        payload.MaxMonthlyCost.Should().Be(5000m);
        payload.ProjectedMonthlySpendUsd.Should().Be(6200m);
    }

    [Fact]
    public async Task AnalyzeAsync_emits_breach_when_max_monthly_cost_has_nested_accounting_parentheses()
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
                        ["maxMonthlyCost"] = "(($5000))",
                        ["projectedImpactUsdUpperBound"] = "6200",
                    }
                }
            ]
        };

        IReadOnlyList<Finding> findings = await _sut.AnalyzeAsync(graph, null, CancellationToken.None);

        findings.Should().ContainSingle()
            .Which.Payload.Should().BeOfType<CostBreachFindingPayload>()
            .Which.MaxMonthlyCost.Should().Be(5000m);
    }

    [Fact]
    public async Task AnalyzeAsync_emits_breach_when_max_monthly_cost_uses_grouped_thousands_in_parentheses()
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
                        ["maxMonthlyCost"] = "($5,000)",
                        ["projectedImpactUsdUpperBound"] = "6200",
                    }
                }
            ]
        };

        IReadOnlyList<Finding> findings = await _sut.AnalyzeAsync(graph, null, CancellationToken.None);

        findings.Should().ContainSingle()
            .Which.Payload.Should().BeOfType<CostBreachFindingPayload>()
            .Which.MaxMonthlyCost.Should().Be(5000m);
    }

    [Fact]
    public async Task AnalyzeAsync_emits_breach_when_upper_bound_uses_accounting_parentheses()
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
                        ["projectedImpactUsdUpperBound"] = "($6200)",
                    }
                }
            ]
        };

        IReadOnlyList<Finding> findings = await _sut.AnalyzeAsync(graph, null, CancellationToken.None);

        findings.Should().ContainSingle()
            .Which.Payload.Should().BeOfType<CostBreachFindingPayload>()
            .Which.ProjectedMonthlySpendUsd.Should().Be(6200m);
    }

    [Fact]
    public async Task AnalyzeAsync_emits_breach_when_max_monthly_cost_has_whitespace_inside_parentheses()
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
                        ["maxMonthlyCost"] = "( $5000 )",
                        ["projectedImpactUsdUpperBound"] = "6200",
                    }
                }
            ]
        };

        IReadOnlyList<Finding> findings = await _sut.AnalyzeAsync(graph, null, CancellationToken.None);

        findings.Should().ContainSingle()
            .Which.Payload.Should().BeOfType<CostBreachFindingPayload>()
            .Which.MaxMonthlyCost.Should().Be(5000m);
    }

    [Fact]
    public async Task AnalyzeAsync_emits_breach_when_max_monthly_cost_has_leading_plus_sign()
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
                        ["maxMonthlyCost"] = "+5000",
                        ["projectedImpactUsdUpperBound"] = "6200",
                    }
                }
            ]
        };

        IReadOnlyList<Finding> findings = await _sut.AnalyzeAsync(graph, null, CancellationToken.None);

        findings.Should().ContainSingle()
            .Which.Payload.Should().BeOfType<CostBreachFindingPayload>()
            .Which.MaxMonthlyCost.Should().Be(5000m);
    }

    [Fact]
    public async Task AnalyzeAsync_emits_breach_when_projected_monthly_spend_has_leading_dollar_sign()
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
                        ["projectedMonthlySpendUsd"] = "$6200",
                    }
                }
            ]
        };

        IReadOnlyList<Finding> findings = await _sut.AnalyzeAsync(graph, null, CancellationToken.None);

        findings.Should().ContainSingle()
            .Which.Payload.Should().BeOfType<CostBreachFindingPayload>()
            .Which.ProjectedMonthlySpendUsd.Should().Be(6200m);
    }

    [Fact]
    public async Task AnalyzeAsync_emits_breach_when_max_monthly_cost_has_non_usd_currency_suffix()
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
                        ["maxMonthlyCost"] = "5000 EUR",
                        ["projectedImpactUsdUpperBound"] = "6200",
                    }
                }
            ]
        };

        IReadOnlyList<Finding> findings = await _sut.AnalyzeAsync(graph, null, CancellationToken.None);

        findings.Should().ContainSingle()
            .Which.Payload.Should().BeOfType<CostBreachFindingPayload>()
            .Which.MaxMonthlyCost.Should().Be(5000m);
    }

    [Fact]
    public async Task AnalyzeAsync_emits_breach_when_upper_bound_has_trailing_currency_suffix()
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
                        ["projectedImpactUsdUpperBound"] = "6200 USD",
                    }
                }
            ]
        };

        IReadOnlyList<Finding> findings = await _sut.AnalyzeAsync(graph, null, CancellationToken.None);

        findings.Should().ContainSingle()
            .Which.Payload.Should().BeOfType<CostBreachFindingPayload>()
            .Which.ProjectedMonthlySpendUsd.Should().Be(6200m);
    }

    [Fact]
    public async Task AnalyzeAsync_emits_breach_when_max_monthly_cost_has_grouped_thousands_and_currency_suffix()
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
                        ["maxMonthlyCost"] = "5,000 USD",
                        ["projectedImpactUsdUpperBound"] = "6200",
                    }
                }
            ]
        };

        IReadOnlyList<Finding> findings = await _sut.AnalyzeAsync(graph, null, CancellationToken.None);

        findings.Should().ContainSingle()
            .Which.Payload.Should().BeOfType<CostBreachFindingPayload>()
            .Which.MaxMonthlyCost.Should().Be(5000m);
    }

    [Fact]
    public async Task AnalyzeAsync_prefers_upper_bound_over_higher_lower_bound_when_point_estimate_absent()
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
                        ["projectedImpactUsdLowerBound"] = "7000",
                    }
                }
            ]
        };

        IReadOnlyList<Finding> findings = await _sut.AnalyzeAsync(graph, null, CancellationToken.None);

        findings.Should().ContainSingle()
            .Which.Payload.Should().BeOfType<CostBreachFindingPayload>()
            .Which.ProjectedMonthlySpendUsd.Should().Be(6200m);
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

    [Fact]
    public async Task AnalyzeAsync_uses_budget_name_not_stored_when_label_and_budget_name_missing()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "cost-node-id",
                    NodeType = "CostConstraint",
                    Label = " ",
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
        finding.Title.Should().Be("Monthly cost breach: Budget name was not stored.");
        CostBreachFindingPayload payload = finding.Payload.Should().BeOfType<CostBreachFindingPayload>().Subject;
        payload.BudgetName.Should().Be("Budget name was not stored.");
    }

    [Fact]
    public async Task AnalyzeAsync_emits_breach_when_only_lower_bound_exceeds_cap()
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
                        ["projectedImpactUsdLowerBound"] = "5800",
                    }
                }
            ]
        };

        IReadOnlyList<Finding> findings = await _sut.AnalyzeAsync(graph, null, CancellationToken.None);

        Finding finding = findings.Should().ContainSingle().Subject;
        finding.Payload.Should().BeOfType<CostBreachFindingPayload>()
            .Which.ProjectedMonthlySpendUsd.Should().Be(5800m);
    }

    [Fact]
    public async Task AnalyzeAsync_appends_illustrative_spend_note_when_confidence_reasoning_is_illustrative()
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
                        ["confidenceReasoning"] = "Topology-derived projected monthly spend (illustrative fallback).",
                    }
                }
            ]
        };

        IReadOnlyList<Finding> findings = await _sut.AnalyzeAsync(graph, null, CancellationToken.None);

        findings.Should().ContainSingle().Subject.Rationale.Should()
            .Contain("Projected spend uses illustrative pricing — not measured tenant spend.");
    }
}
