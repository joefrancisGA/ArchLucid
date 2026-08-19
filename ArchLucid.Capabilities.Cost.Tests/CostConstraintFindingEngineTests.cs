using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Findings.Payloads;
using ArchLucid.KnowledgeGraph.Models;

using FluentAssertions;

namespace ArchLucid.Capabilities.Cost.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class CostConstraintFindingEngineTests
{
    private readonly CostConstraintFindingEngine _sut = new();

    [Fact]
    public void EngineType_and_Category_are_fixed_values()
    {
        _sut.EngineType.Should().Be("cost-constraint");
        _sut.Category.Should().Be("Cost");
    }

    [Fact]
    public async Task AnalyzeAsync_ReturnsEmpty_WhenNoCostNodes()
    {
        GraphSnapshot graph = new()
        {
            Nodes = [],
            Edges = []
        };

        IReadOnlyList<Finding> findings = await _sut.AnalyzeAsync(graph, CancellationToken.None);

        findings.Should().BeEmpty();
    }

    [Fact]
    public async Task AnalyzeAsync_MapsHighCostRisk_ToWarningSeverity_WithHighSpendAlternatives()
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
                        ["costRisk"] = "high"
                    }
                }
            ],
            Edges = []
        };

        IReadOnlyList<Finding> findings = await _sut.AnalyzeAsync(graph, CancellationToken.None);

        Finding f = findings.Should().ContainSingle().Subject;
        f.Severity.Should().Be(FindingSeverity.Warning);
        f.PayloadType.Should().Be(nameof(CostConstraintFindingPayload));
        CostConstraintFindingPayload payload = f.Payload.Should().BeOfType<CostConstraintFindingPayload>().Subject;
        payload.BudgetName.Should().Be("Prod");
        payload.MaxMonthlyCost.Should().Be(5000m);
        payload.CostRisk.Should().Be("high");
        f.Trace.DecisionsTaken.Should().NotBeEmpty();
        f.Trace.RulesApplied.Should().Contain("cost-constraint-surface");
        f.Trace.Notes.Should().Contain(n => n.Contains("Budget cap:", StringComparison.Ordinal));
        f.Trace.AlternativePathsConsidered.Should().Contain(s => s.Contains("reserved capacity", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task AnalyzeAsync_NonHighRisk_UsesInfoSeverity_And_RightSizeAlternatives()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "c2",
                    NodeType = "CostConstraint",
                    Label = "low",
                    Properties = new Dictionary<string, string> { ["costRisk"] = "low" }
                }
            ],
            Edges = []
        };

        IReadOnlyList<Finding> findings = await _sut.AnalyzeAsync(graph, CancellationToken.None);

        Finding f = findings.Should().ContainSingle().Subject;
        f.Severity.Should().Be(FindingSeverity.Info);
        f.Trace.AlternativePathsConsidered.Should().Contain(s => s.Contains("Right-size", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task AnalyzeAsync_FallsBackBudgetName_ToLabel_WhenBudgetNameAbsent()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "c3",
                    NodeType = "CostConstraint",
                    Label = "from-label-only",
                    Properties = new Dictionary<string, string>()
                }
            ],
            Edges = []
        };

        IReadOnlyList<Finding> findings = await _sut.AnalyzeAsync(graph, CancellationToken.None);

        Finding f = findings.Should().ContainSingle().Subject;
        CostConstraintFindingPayload payload = f.Payload.Should().BeOfType<CostConstraintFindingPayload>().Subject;
        payload.BudgetName.Should().Be("from-label-only");
        payload.CostRisk.Should().Be("unknown");
    }

    [Fact]
    public async Task AnalyzeAsync_IgnoresUnparseableMaxMonthly_KeepsNoteWithoutCap()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "c4",
                    NodeType = "CostConstraint",
                    Label = "bad-number",
                    Properties = new Dictionary<string, string> { ["maxMonthlyCost"] = "not-a-decimal" }
                }
            ],
            Edges = []
        };

        IReadOnlyList<Finding> findings = await _sut.AnalyzeAsync(graph, CancellationToken.None);

        Finding f = findings.Should().ContainSingle().Subject;
        CostConstraintFindingPayload payload = f.Payload.Should().BeOfType<CostConstraintFindingPayload>().Subject;
        payload.MaxMonthlyCost.Should().BeNull();
        f.Trace.Notes.Should().ContainSingle().Subject.Should().Be("No explicit budget cap.");
    }

    [Fact]
    public async Task AnalyzeAsync_ReturnsFindingPerCostNode()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "a",
                    NodeType = "CostConstraint",
                    Label = "first",
                    Properties = []
                },
                new GraphNode
                {
                    NodeId = "b",
                    NodeType = "CostConstraint",
                    Label = "second",
                    Properties = []
                }
            ],
            Edges = []
        };

        IReadOnlyList<Finding> findings = await _sut.AnalyzeAsync(graph, CancellationToken.None);

        findings.Should().HaveCount(2);
        findings.Select(static f => f.RelatedNodeIds.Single()).Should().BeEquivalentTo(["a", "b"]);
    }
}
