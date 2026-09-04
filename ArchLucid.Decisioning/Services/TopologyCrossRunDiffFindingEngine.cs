using ArchLucid.Decisioning.Analysis;
using ArchLucid.Decisioning.Findings;
using ArchLucid.Decisioning.Findings.Factories;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Models;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Decisioning.Services;

public sealed class TopologyCrossRunDiffFindingEngine(
    IGraphSnapshotRepository graphSnapshotRepository,
    IScopeContextProvider scopeContextProvider) : IFindingEngine
{
    private readonly IGraphSnapshotRepository _graphSnapshotRepository =
        graphSnapshotRepository ?? throw new ArgumentNullException(nameof(graphSnapshotRepository));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    public string EngineType => "topology-cross-run-diff";

    public string Category => "Topology";

    public async Task<IReadOnlyList<Finding>> AnalyzeAsync(
        GraphSnapshot graphSnapshot,
        FindingAnalysisContext? analysisContext,
        CancellationToken ct)
    {
        CrossRunDiffFindingPriorGuard.EnsurePriorPresentOrThrow(analysisContext, EngineType);

        GraphSnapshot? priorGraph = await TryLoadPriorGraphAsync(analysisContext, ct).ConfigureAwait(false);
        CrossRunDiffFindingPriorGuard.EnsurePriorGraphLoadedOrThrow(analysisContext, priorGraph, EngineType);
        CrossRunDiffFindingPriorGuard.EnsurePriorGraphPinFingerprintsMatchOrThrow(analysisContext, priorGraph, EngineType);
        CrossRunDiffFindingPriorGuard.EnsurePriorRevisionResolvableOrThrow(
            analysisContext,
            priorGraph,
            graphSnapshot,
            ContextGraphPropertyKeys.PriorTopologyCategories,
            EngineType);
        TopologyCategoryDiffResult diff = GraphSnapshotTopologyDiffAnalyzer.AnalyzeCategoryDelta(graphSnapshot, priorGraph);
        List<Finding> findings = [];
        List<string> scopeNodeIds = CrossRunDiffFindingGraphScope.CollectTopologyNodeIds(graphSnapshot);

        if (diff.PriorCategories.Count == 0)
            return findings;

        if (diff.RemovedCategories.Count > 0)
        {
            findings.Add(FindingFactory.CreateTopologyGapFinding(
                EngineType,
                "Topology categories regressed since the prior committed run",
                "One or more topology categories present in the prior graph snapshot are absent in the current graph.",
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
                Rationale = "New topology categories appeared relative to the prior graph snapshot.",
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
                    DecisionsTaken = ["Compared current topology categories to prior graph snapshot Γ."],
                    Notes =
                    [
                        $"Prior: {string.Join(", ", diff.PriorCategories)}",
                        $"Added: {string.Join(", ", diff.AddedCategories)}"
                    ]
                }
            });
        }

        return findings;
    }

    private async Task<GraphSnapshot?> TryLoadPriorGraphAsync(
        FindingAnalysisContext? analysisContext,
        CancellationToken cancellationToken)
    {
        if (analysisContext?.Prior?.PriorGraphSnapshotId is not Guid priorGraphId || priorGraphId == Guid.Empty)
            return null;

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        return await _graphSnapshotRepository
            .GetByIdAsync(scope, priorGraphId, cancellationToken)
            .ConfigureAwait(false);
    }
}
