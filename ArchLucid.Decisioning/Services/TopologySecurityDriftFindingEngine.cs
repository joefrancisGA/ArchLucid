using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Findings.Payloads;
using ArchLucid.Core.Findings;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Analysis;
using ArchLucid.Decisioning.Findings;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Decisioning.Services;

/// <summary>
///     Emits Decision-grade findings for security-semantic graph drift vs the prior sealed snapshot (DX-64).
/// </summary>
public sealed class TopologySecurityDriftFindingEngine(
    IGraphSnapshotRepository graphSnapshotRepository,
    IScopeContextProvider scopeContextProvider) : IFindingEngine
{
    /// <summary>Hard cap on drift findings per snapshot (DX-64).</summary>
    public const int MaxFindingsPerSnapshot = 10;

    private readonly IGraphSnapshotRepository _graphSnapshotRepository =
        graphSnapshotRepository ?? throw new ArgumentNullException(nameof(graphSnapshotRepository));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    public string EngineType => "topology-security-drift";

    public string Category => "Security";

    public async Task<IReadOnlyList<Finding>> AnalyzeAsync(
        GraphSnapshot graphSnapshot,
        FindingAnalysisContext? analysisContext,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(graphSnapshot);

        if (analysisContext?.Prior?.PriorGraphSnapshotId is not Guid priorGraphId || priorGraphId == Guid.Empty)
        {
            HeldCheckLedger.TryRecord(analysisContext, EngineType, HeldCheckInputCode.PriorRunSnapshot);

            return [];
        }

        GraphSnapshot? priorGraph = await TryLoadPriorGraphAsync(analysisContext, ct).ConfigureAwait(false);

        if (priorGraph is null)
        {
            HeldCheckLedger.TryRecord(analysisContext, EngineType, HeldCheckInputCode.PriorRunSnapshot);

            return [];
        }

        CrossRunDiffFindingPriorGuard.EnsurePriorPresentOrThrow(analysisContext, EngineType);
        CrossRunDiffFindingPriorGuard.EnsurePriorGraphLoadedOrThrow(analysisContext, priorGraph, EngineType);
        CrossRunDiffFindingPriorGuard.EnsurePriorGraphPinFingerprintsMatchOrThrow(analysisContext, priorGraph, EngineType);

        IReadOnlyList<TopologySecurityDelta> deltas = TopologySecurityDeltaAnalyzer.Analyze(graphSnapshot, priorGraph);

        if (deltas.Count == 0)
        {
            return [];
        }

        Guid priorRunId = analysisContext.Prior!.PriorRunId!.Value;
        List<Finding> findings = [];

        foreach (TopologySecurityDelta delta in deltas.Take(MaxFindingsPerSnapshot))
        {
            findings.Add(BuildFinding(delta, graphSnapshot, priorRunId, priorGraphId));
        }

        return findings;
    }

    private async Task<GraphSnapshot?> TryLoadPriorGraphAsync(
        FindingAnalysisContext? analysisContext,
        CancellationToken cancellationToken)
    {
        if (analysisContext?.Prior?.PriorGraphSnapshotId is not Guid priorGraphId || priorGraphId == Guid.Empty)
        {
            return null;
        }

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        return await _graphSnapshotRepository
            .GetByIdAsync(scope, priorGraphId, cancellationToken)
            .ConfigureAwait(false);
    }

    private static Finding BuildFinding(
        TopologySecurityDelta delta,
        GraphSnapshot currentGraph,
        Guid priorRunId,
        Guid priorGraphSnapshotId)
    {
        List<string> relatedNodeIds = [delta.NodeId];
        List<string> evidenceRefs = FindingGraphEvidenceRefs.CollectWithProductShapedGraphNodeFallback(
            currentGraph,
            relatedNodeIds);
        TopologySecurityDriftFindingPayloadKind payloadKind = MapPayloadKind(delta.Kind);

        return new Finding
        {
            FindingType = "TopologySecurityDriftFinding",
            Category = "Security",
            EngineType = "topology-security-drift",
            Severity = ResolveSeverity(delta.Kind),
            Title = BuildTitle(delta),
            Rationale = delta.Detail ?? BuildTitle(delta),
            RelatedNodeIds = relatedNodeIds,
            EvidenceRefs = evidenceRefs,
            PayloadType = nameof(TopologySecurityDriftFindingPayload),
            Payload = new TopologySecurityDriftFindingPayload
            {
                Kind = payloadKind,
                NodeId = delta.NodeId,
                PriorRunId = priorRunId,
                PriorGraphSnapshotId = priorGraphSnapshotId,
            },
            Trace = new ExplainabilityTrace
            {
                GraphNodeIdsExamined = relatedNodeIds,
                RulesApplied = ["topology-security-drift", delta.Kind.ToString()],
                DecisionsTaken =
                [
                    $"Compared current graph node '{delta.NodeLabel}' to prior graph snapshot {priorGraphSnapshotId}.",
                ],
                Notes =
                [
                    $"priorRunId:{priorRunId}",
                    $"priorGraphSnapshotId:{priorGraphSnapshotId}",
                    $"deltaKind:{delta.Kind}",
                ],
            },
        };
    }

    private static TopologySecurityDriftFindingPayloadKind MapPayloadKind(TopologySecurityDeltaKind kind) =>
        kind switch
        {
            TopologySecurityDeltaKind.PublicInboundAdded => TopologySecurityDriftFindingPayloadKind.PublicInboundAdded,
            TopologySecurityDeltaKind.ReplicaOrFailoverRemoved =>
                TopologySecurityDriftFindingPayloadKind.ReplicaOrFailoverRemoved,
            TopologySecurityDeltaKind.AdminInboundWidened => TopologySecurityDriftFindingPayloadKind.AdminInboundWidened,
            TopologySecurityDeltaKind.WriteAdminRoleAdded => TopologySecurityDriftFindingPayloadKind.WriteAdminRoleAdded,
            _ => throw new ArgumentOutOfRangeException(nameof(kind), kind, "Unknown topology security delta kind."),
        };

    private static FindingSeverity ResolveSeverity(TopologySecurityDeltaKind kind) =>
        kind switch
        {
            TopologySecurityDeltaKind.PublicInboundAdded => FindingSeverity.Warning,
            TopologySecurityDeltaKind.ReplicaOrFailoverRemoved => FindingSeverity.Error,
            TopologySecurityDeltaKind.AdminInboundWidened => FindingSeverity.Error,
            TopologySecurityDeltaKind.WriteAdminRoleAdded => FindingSeverity.Error,
            _ => throw new ArgumentOutOfRangeException(nameof(kind), kind, "Unknown topology security delta kind."),
        };

    private static string BuildTitle(TopologySecurityDelta delta) =>
        delta.Kind switch
        {
            TopologySecurityDeltaKind.PublicInboundAdded =>
                $"Public inbound access appeared on '{delta.NodeLabel}' since the prior sealed graph.",
            TopologySecurityDeltaKind.ReplicaOrFailoverRemoved =>
                $"Replica or failover evidence removed from '{delta.NodeLabel}' since the prior sealed graph.",
            TopologySecurityDeltaKind.AdminInboundWidened =>
                $"Admin inbound access widened on '{delta.NodeLabel}' since the prior sealed graph.",
            TopologySecurityDeltaKind.WriteAdminRoleAdded =>
                $"Write/admin role path to '{delta.NodeLabel}' appeared since the prior sealed graph.",
            _ => throw new ArgumentOutOfRangeException(nameof(delta), delta.Kind, "Unknown topology security delta kind."),
        };
}
