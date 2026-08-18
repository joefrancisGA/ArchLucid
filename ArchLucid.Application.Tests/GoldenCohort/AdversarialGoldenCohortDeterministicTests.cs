using System.Text.Json;

using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

using FluentAssertions;

namespace ArchLucid.Application.Tests.GoldenCohort;

[Trait("Suite", "GoldenCohortAdversarial")]
public sealed class AdversarialGoldenCohortDeterministicTests
{
    private static readonly string AdversarialRoot = Path.Combine(
        AppContext.BaseDirectory,
        "..",
        "..",
        "..",
        "..",
        "tests",
        "golden-cohort",
        "adversarial");

    [Fact]
    public void Adversarial_fixtures_run_deterministic_scorers()
    {
        List<string> fixtureFiles = Directory.Exists(AdversarialRoot)
            ? Directory.GetFiles(AdversarialRoot, "*.json").ToList()
            : [];

        fixtureFiles.Count.Should().BeGreaterThanOrEqualTo(6);

        Dictionary<string, object> scores = new();

        foreach (string fixturePath in fixtureFiles)
        {
            string trap = Path.GetFileNameWithoutExtension(fixturePath);
            scores[trap] = ScoreTrap(trap);
        }

        string scoresDir = Path.Combine(AdversarialRoot, "scores");
        Directory.CreateDirectory(scoresDir);
        string scoresPath = Path.Combine(scoresDir, "adversarial-deterministic-scores.json");
        File.WriteAllText(scoresPath, JsonSerializer.Serialize(scores, new JsonSerializerOptions { WriteIndented = true }));

        scores.Should().ContainKey("missing-evidence-trap");
        scores["missing-evidence-trap"].Should().Be("gate-rejected");
    }

    private static string ScoreTrap(string trap)
    {
        switch (trap)
        {
            case "compensating-control-trap":
            case "evidence-contradicts-narrative":
            case "missing-evidence-trap":
                return ScoreUnknownEndpointTrap();

            case "synthetic-datastore-alias-trap":
                return ScoreSyntheticDatastoreTrap();

            case "risk-accepted-not-pass":
                return ScoreRiskAcceptedTrap();

            case "hub-spoke-mislabel":
                return ScoreHubSpokeTrap();

            default:
                return "skipped";
        }
    }

    private static string ScoreUnknownEndpointTrap()
    {
        GraphSnapshot graph = TinyGraph("hub", "spoke");
        AgentResult topology = RelationshipOnly("missing-a", "missing-b");

        IReadOnlyList<AgentResult> validated =
            AgentTopologyProposalMergeGate.FilterValidatedProposals(graph, [topology]);

        return validated.Count == 0 ? "gate-rejected" : "gate-accepted-unexpected";
    }

    private static string ScoreSyntheticDatastoreTrap()
    {
        GraphSnapshot graph = TinyGraph("api", "db");
        AgentResult topology = RelationshipOnly("api", "ds-db");

        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        return GraphMergeInvariantChecker.Check(merged).Count == 0 ? "merge-clean" : "invariant-violation";
    }

    private static string ScoreRiskAcceptedTrap()
    {
        SpecialistReviewFinding finding = new()
        {
            FindingId = "trap-risk-accepted",
            Dimension = QualityDimension.PrivacyCompliance,
            Title = "Risk accepted trap",
            Rationale = "Attempt to accept risk while conclusion still reads Pass.",
            Conclusion = ReviewConclusion.Pass,
            EvidenceCondition = EvidenceCondition.Sufficient,
            GovernanceDisposition = GovernanceDisposition.Open,
            Provenance = new ClaimProvenance(),
            Confidence = 0.9,
            Severity = "High",
        };

        bool acceptedOnPass = FindingStatusCompositionRules.TryApplyGovernanceDisposition(
            finding,
            GovernanceDispositionLifecycleEvent.SetAccepted,
            "reviewer-1",
            out SpecialistReviewFinding _,
            out string? _);

        return acceptedOnPass ? "disposition-accepted-on-pass-unexpected" : "disposition-not-pass";
    }

    private static string ScoreHubSpokeTrap()
    {
        GraphSnapshot graph = TinyGraph("hub", "spoke-a");
        AgentResult topology = RelationshipOnly("hub", "spoke-a");
        GraphSnapshot merged = AgentTopologyProposalGraphMerge.WithMergedTopologyProposals(graph, [topology]);

        return GraphMergeInvariantChecker.Check(merged).Count == 0 ? "merge-clean" : "invariant-violation";
    }

    private static GraphSnapshot TinyGraph(string leftId, string rightId)
    {
        return new GraphSnapshot
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            CreatedUtc = DateTime.UtcNow,
            Nodes =
            [
                Node(leftId),
                Node(rightId)
            ],
            Edges = [],
            Warnings = [],
        };
    }

    private static GraphNode Node(string id)
    {
        return new GraphNode
        {
            NodeId = id,
            NodeType = GraphNodeTypes.TopologyResource,
            Label = id,
            Category = GraphTopologyCategories.Compute,
            SourceType = "Inventory",
            SourceId = id,
        };
    }

    private static AgentResult RelationshipOnly(string sourceId, string targetId)
    {
        return new AgentResult
        {
            ResultId = $"trap-{sourceId}-{targetId}",
            TaskId = $"trap-task-{sourceId}-{targetId}",
            RunId = Guid.NewGuid().ToString("D"),
            AgentType = AgentType.Topology,
            ProposedChanges = new AgentTopologyProposal
            {
                SourceAgent = AgentType.Topology,
                AddedRelationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = sourceId,
                        TargetId = targetId,
                        RelationshipType = RelationshipType.ReadsFrom,
                    }
                ]
            }
        };
    }
}
