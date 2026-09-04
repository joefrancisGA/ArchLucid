using ArchLucid.Contracts.Findings.Payloads;
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

public sealed class RequirementCrossRunDiffFindingEngine(
    IGraphSnapshotRepository graphSnapshotRepository,
    IScopeContextProvider scopeContextProvider) : IFindingEngine
{
    private readonly IGraphSnapshotRepository _graphSnapshotRepository =
        graphSnapshotRepository ?? throw new ArgumentNullException(nameof(graphSnapshotRepository));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    public string EngineType => "requirement-cross-run-diff";

    public string Category => "Requirement";

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
            ContextGraphPropertyKeys.PriorRequirementNames,
            EngineType);
        RequirementNameDiffResult diff = GraphSnapshotRequirementDiffAnalyzer.AnalyzeNameDelta(graphSnapshot, priorGraph);
        List<Finding> findings = [];
        List<string> scopeNodeIds = CrossRunDiffFindingGraphScope.CollectRequirementNodeIds(graphSnapshot);

        if (diff.PriorRequirementNames.Count == 0)
            return findings;

        if (diff.RemovedRequirementNames.Count > 0)
        {
            findings.Add(FindingFactory.CreateRequirementGapFinding(
                EngineType,
                "Requirement set regressed since the prior committed run",
                "One or more requirements present in the prior graph snapshot are absent in the current graph.",
                "requirement-set-regression",
                $"Removed requirements: {string.Join(", ", diff.RemovedRequirementNames)}",
                "Reviewers may miss regressions in traceability when requirements disappear between runs.",
                FindingSeverity.Warning,
                scopeNodeIds));
        }

        if (diff.AddedRequirementNames.Count > 0)
        {
            findings.Add(new Finding
            {
                FindingSchemaVersion = FindingsSchema.CurrentFindingVersion,
                FindingType = "RequirementCoverageFinding",
                Category = Category,
                EngineType = EngineType,
                Severity = FindingSeverity.Info,
                Title = "Requirement set expanded since the prior committed run",
                Rationale = "New requirements appeared relative to the prior graph snapshot.",
                RelatedNodeIds = scopeNodeIds,
                PayloadType = nameof(RequirementCoverageFindingPayload),
                Payload = new RequirementCoverageFindingPayload
                {
                    RequirementNodeCount = diff.CurrentRequirementNames.Count,
                    CoveredRequirementCount = diff.CurrentRequirementNames.Count - diff.AddedRequirementNames.Count,
                    UncoveredRequirementCount = diff.AddedRequirementNames.Count,
                    UncoveredRequirements = diff.AddedRequirementNames
                },
                Trace = new ExplainabilityTrace
                {
                    GraphNodeIdsExamined = scopeNodeIds,
                    RulesApplied = ["requirement-cross-run-name-diff"],
                    DecisionsTaken = ["Compared current requirement names to prior graph snapshot Γ."],
                    Notes =
                    [
                        $"Prior: {string.Join(", ", diff.PriorRequirementNames)}",
                        $"Added: {string.Join(", ", diff.AddedRequirementNames)}"
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
