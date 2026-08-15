using ArchLucid.Decisioning.Analysis;
using ArchLucid.Decisioning.Findings.Factories;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Models;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Decisioning.Services;

public sealed class TopologyCrossRunDiffFindingEngine : IFindingEngine
{
    public string EngineType => "topology-cross-run-diff";

    public string Category => "Topology";

    public Task<IReadOnlyList<Finding>> AnalyzeAsync(GraphSnapshot graphSnapshot, CancellationToken ct)
    {
        TopologyCategoryDiffResult diff = GraphSnapshotTopologyDiffAnalyzer.AnalyzeCategoryDelta(graphSnapshot);
        List<Finding> findings = [];
        List<string> scopeNodeIds = CrossRunDiffFindingGraphScope.CollectTopologyNodeIds(graphSnapshot);

        if (diff.PriorCategories.Count == 0)
            return Task.FromResult<IReadOnlyList<Finding>>(findings);

        if (diff.RemovedCategories.Count > 0)
        {
            findings.Add(FindingFactory.CreateTopologyGapFinding(
                EngineType,
                "Topology categories regressed since the prior committed run",
                "One or more topology categories present in the prior context snapshot are absent in the current graph.",
                "topology-category-regression",
                $"Removed categories: {string.Join(", ", diff.RemovedCategories)}",
                "Reviewers may miss regressions in landing-zone coverage when categories disappear between runs.",
                FindingSeverity.Warning,
                scopeNodeIds));
        }

        if (diff.AddedCategories.Count > 0)
        {
            findings.Add(new Finding
            {
                FindingSchemaVersion = FindingsSchema.CurrentFindingVersion,
                FindingType = "TopologyCoverageFinding",
                Category = Category,
                EngineType = EngineType,
                Severity = FindingSeverity.Info,
                Title = "Topology categories expanded since the prior committed run",
                Rationale = "New topology categories appeared relative to the prior context snapshot.",
                RelatedNodeIds = scopeNodeIds,
                PayloadType = nameof(TopologyCoverageFindingPayload),
                Payload = new TopologyCoverageFindingPayload
                {
                    TopologyNodeCount = graphSnapshot.GetNodesByType(GraphNodeTypes.TopologyResource).Count,
                    PresentCategories = diff.CurrentCategories,
                    ExpectedCategories = diff.PriorCategories,
                    MissingCategories = []
                },
                Trace = new ExplainabilityTrace
                {
                    GraphNodeIdsExamined = scopeNodeIds,
                    RulesApplied = ["topology-cross-run-category-diff"],
                    DecisionsTaken = ["Compared current topology categories to prior committed snapshot metadata."],
                    Notes =
                    [
                        $"Prior: {string.Join(", ", diff.PriorCategories)}",
                        $"Added: {string.Join(", ", diff.AddedCategories)}"
                    ]
                }
            });
        }

        return Task.FromResult<IReadOnlyList<Finding>>(findings);
    }
}
