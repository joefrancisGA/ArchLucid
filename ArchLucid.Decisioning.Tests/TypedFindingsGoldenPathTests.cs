using ArchLucid.Capabilities.Cost;
using ArchLucid.Contracts.Findings;
using ArchLucid.Decisioning.Analysis;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Decisioning.Compliance.Evaluators;
using ArchLucid.Decisioning.Compliance.Loaders;
using ArchLucid.Decisioning.Configuration;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Manifest.Builders;
using ArchLucid.Decisioning.Models;
using ArchLucid.Decisioning.Rules;
using ArchLucid.Core.Findings;
using ArchLucid.Decisioning.Services;
using ArchLucid.KnowledgeGraph.Models;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

namespace ArchLucid.Decisioning.Tests;

/// <summary>
/// Tests for Typed Findings Golden Path.
/// </summary>

[Trait("Suite", "Core")]
[Trait("Category", "Slow")]
public sealed class TypedFindingsGoldenPathTests
{
    [Fact]
    public async Task EndToEnd_SecurityCostAndComplianceFlowThroughFindingsAndManifest()
    {
        Guid runId = Guid.NewGuid();
        Guid ctxId = Guid.NewGuid();
        GraphSnapshot graph = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            RunId = runId,
            Edges =
            {
                new GraphEdge
                {
                    EdgeId = "rel1",
                    FromNodeId = "r1",
                    ToNodeId = "t1",
                    EdgeType = GraphEdgeTypes.RelatesTo,
                    Label = "relates to",
                    Weight = GraphEdgeDecisioningThresholds.MinWeightForSemanticLink
                },
                new GraphEdge { EdgeId = "p1", FromNodeId = "s1", ToNodeId = "t1", EdgeType = "PROTECTS", Label = "protects" },
                new GraphEdge { EdgeId = "p2", FromNodeId = "s1", ToNodeId = "t2", EdgeType = "PROTECTS", Label = "protects" },
                new GraphEdge { EdgeId = "p3", FromNodeId = "s1", ToNodeId = "t3", EdgeType = "PROTECTS", Label = "protects" },
                new GraphEdge { EdgeId = "p4", FromNodeId = "s1", ToNodeId = "t4", EdgeType = "PROTECTS", Label = "protects" }
            },
            Nodes =
            {
                new GraphNode
                {
                    NodeId = "r1",
                    NodeType = "Requirement",
                    Label = "Auth",
                    Properties = new Dictionary<string, string> { ["text"] = "Authenticate users" }
                },
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = "TopologyResource",
                    Label = "vpc",
                    Category = "network",
                    Properties = []
                },
                new GraphNode
                {
                    NodeId = "t2",
                    NodeType = "TopologyResource",
                    Label = "vm",
                    Category = "compute",
                    Properties = []
                },
                new GraphNode
                {
                    NodeId = "t3",
                    NodeType = "TopologyResource",
                    Label = "blob",
                    Category = "storage",
                    Properties = []
                },
                new GraphNode
                {
                    NodeId = "t4",
                    NodeType = "TopologyResource",
                    Label = "db",
                    Category = "data",
                    Properties = []
                },
                new GraphNode
                {
                    NodeId = "s1",
                    NodeType = "SecurityBaseline",
                    Label = "MFA",
                    Properties = new Dictionary<string, string>
                    {
                        ["controlId"] = "AC-2",
                        ["status"] = "missing"
                    }
                },
                new GraphNode
                {
                    NodeId = "c1",
                    NodeType = "CostConstraint",
                    Label = "Prod",
                    Properties = new Dictionary<string, string>
                    {
                        ["budgetName"] = "Prod",
                        ["maxMonthlyCost"] = "5000",
                        ["costRisk"] = "high"
                    }
                }
            }
        };

        GraphCoverageAnalyzer analyzer = new();
        string complianceRulePackPath = Path.Combine(
            AppContext.BaseDirectory,
            "Compliance",
            "RulePacks",
            "default-compliance.rules.json");
        FileComplianceRulePackLoader complianceLoader = new(complianceRulePackPath);
        FileComplianceRulePackProvider complianceProvider = new(complianceLoader);
        ComplianceRulePackValidator complianceValidator = new();
        GraphComplianceEvaluator complianceEvaluator = new();

        IFindingEngine[] engines =
        [
            new RequirementFindingEngine(),
            new TopologyCoverageFindingEngine(analyzer),
            new SecurityBaselineFindingEngine(),
            new SecurityCoverageFindingEngine(analyzer),
            new ComplianceFindingEngine(complianceProvider, complianceValidator, complianceEvaluator),
            new CostConstraintFindingEngine()
        ];

        FindingsOrchestrator orchestrator = FindingsOrchestratorComposer.Compose(
            engines,
            new FindingPayloadValidator(),
            Options.Create(new HumanReviewFindingOptions()),
            DeterministicInsightDensityGate.CreateDefault(),
            TimeProvider.System);

        FindingsSnapshot snapshot = await orchestrator.GenerateFindingsSnapshotAsync(runId, ctxId, graph, CancellationToken.None);

        IEnumerable<Finding> packageFindings = AllPackageFindings(snapshot);

        packageFindings.Should().Contain(f =>
            f.FindingType == "RequirementFinding"
            && f.RelatedNodeIds.Contains("t1")
            && f.Trace!.DecisionsTaken.Count > 0
            && f.Trace.RulesApplied.Contains("requirement-surface")
            && f.Trace.Notes.Any(n => n.StartsWith("Related topology resources:", StringComparison.Ordinal)));

        packageFindings.Should().Contain(f => f.FindingType == "CostConstraintFinding");
        packageFindings.Should().Contain(f =>
            f.FindingType == "SecurityControlFinding" && f.RelatedNodeIds.Contains("t1"));

        RuleBasedDecisionEngine decisionEngine = Feasibility.RuleBasedDecisionEngineTestDependencies.CreateEngine(
            new InMemoryDecisionRuleProvider());

        // Decision-grade manifest materialization reads promoted rows only (ADR 0070); checklist findings stay on-package.
        (ManifestDocument manifest, _) = await decisionEngine.DecideAsync(runId, ctxId, graph, snapshot, CancellationToken.None);

        packageFindings.Should().Contain(f =>
            f.FindingType == "ComplianceFinding"
            && f.RelatedNodeIds.Any(id => string.Equals(id, "t3", StringComparison.OrdinalIgnoreCase)));
        manifest.Cost.MaxMonthlyCost.Should().BeNull("cost constraint typed findings demote without diagram citations");
        manifest.Security.Controls.Should().Contain(c => c.ControlId == "AC-2" && c.Status == "missing");
        manifest.Compliance.Controls.Should().BeEmpty();
        manifest.Decisions.Should().Contain(d =>
            d.Category == "Security" && d.Title.Contains("MFA", StringComparison.Ordinal));
    }

    /// <summary>
    ///     After insight-density demotion (DX-59), typed-engine rows may reside in
    ///     <see cref="FindingsSnapshot.ChecklistCoverage" /> rather than <see cref="FindingsSnapshot.Findings" />.
    /// </summary>
    private static IEnumerable<Finding> AllPackageFindings(FindingsSnapshot snapshot) =>
        snapshot.Findings.Concat(snapshot.ChecklistCoverage);
}
