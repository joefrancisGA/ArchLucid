using ArchLucid.Contracts.Architecture;
using ArchLucid.Decisioning.Analysis;
using ArchLucid.Decisioning.Findings;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Models;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Decisioning.Services;

/// <summary>
///     Surfaces external-actor paths to sensitive datastores that never cross a modeled trust boundary or private-endpoint hop (DX-32).
/// </summary>
public sealed class DataFlowTrustBoundaryFindingEngine : IFindingEngine
{
    public string EngineType => "data-flow-trust-boundary";

    public string Category => "Security";

    public Task<IReadOnlyList<Finding>> AnalyzeAsync(
        GraphSnapshot graphSnapshot,
        FindingAnalysisContext? analysisContext,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(graphSnapshot);

        IReadOnlyList<DataFlowTrustBoundaryPath> paths = DataFlowTrustBoundaryPathAnalyzer.Analyze(graphSnapshot);

        if (paths.Count == 0)
        {
            return Task.FromResult<IReadOnlyList<Finding>>([]);
        }

        List<Finding> findings = paths.Select(path => BuildFinding(graphSnapshot, path)).ToList();

        return Task.FromResult<IReadOnlyList<Finding>>(findings);
    }

    private static Finding BuildFinding(GraphSnapshot graphSnapshot, DataFlowTrustBoundaryPath path)
    {
        List<string> relatedNodeIds = path.PathNodeIds
            .Where(static nodeId => !string.IsNullOrWhiteSpace(nodeId))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Take(8)
            .ToList();

        List<string> traceNotes = relatedNodeIds
            .Select(static nodeId => $"evidence:graph-node:{nodeId}")
            .ToList();

        List<string> evidenceRefs = FindingGraphEvidenceRefs.CollectFromNodeIds(graphSnapshot, relatedNodeIds);

        return new Finding
        {
            FindingSchemaVersion = FindingsSchema.CurrentFindingVersion,
            FindingType = "DataFlowTrustBoundaryFinding",
            Category = "Security",
            EngineType = "data-flow-trust-boundary",
            Severity = FindingSeverity.Error,
            Title =
                $"External actor '{path.ActorLabel}' reaches sensitive datastore '{path.DatastoreLabel}' in {path.HopCount} hop(s) without crossing a trust boundary",
            Rationale =
                $"An external-facing actor can reach datastore '{path.DatastoreLabel}' in {path.HopCount} graph hop(s) without traversing a TrustBoundary node or private-endpoint hop.",
            DecisionConsequence =
                "Insert a trust-boundary control on the path, enable a private endpoint on the datastore, or document an approved exception before approval.",
            RelatedNodeIds = relatedNodeIds,
            EvidenceRefs = evidenceRefs,
            PayloadType = nameof(DataFlowTrustBoundaryFindingPayload),
            Payload = new DataFlowTrustBoundaryFindingPayload
            {
                ActorNodeId = path.ActorNodeId,
                DatastoreNodeId = path.DatastoreNodeId,
                HopCount = path.HopCount,
                PathNodeIds = path.PathNodeIds.ToList(),
                CrossedTrustBoundary = false,
            },
            RecommendedActions =
            [
                "Verify whether the external actor requires direct reachability to the sensitive datastore.",
                "Prefer private endpoints or an explicit trust-boundary hop between ingress and data-bearing resources.",
            ],
            Trace = new ExplainabilityTrace
            {
                GraphNodeIdsExamined = relatedNodeIds,
                RulesApplied = ["data-flow-trust-boundary"],
                DecisionsTaken =
                [
                    "External actor path to sensitive datastore without trust-boundary or private-endpoint hop.",
                ],
                Notes = traceNotes,
            },
        };
    }
}
