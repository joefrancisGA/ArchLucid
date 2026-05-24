using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Persistence.DecisionTraces;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.Manifest;

namespace ArchLucid.Core.Persistence.Ports;

/// <summary>Builds golden manifest and decision trace from context, graph, and findings snapshots.</summary>
public interface IDecisionEngine
{
    Task<(ManifestDocument Manifest, DecisionTraceDto Trace)> DecideAsync(
        Guid runId,
        Guid contextSnapshotId,
        GraphSnapshot graphSnapshot,
        FindingsSnapshot findingsSnapshot,
        CancellationToken ct);
}
