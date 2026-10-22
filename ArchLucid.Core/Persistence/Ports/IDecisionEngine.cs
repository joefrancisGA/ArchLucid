using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Persistence.DecisionTraces;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.Manifest;

namespace ArchLucid.Core.Persistence.Ports;

/// <summary>
///     Builds golden manifest and decision trace from context, graph, and findings snapshots.
///     This is the only producer of <c>ManifestDocument</c> + <c>DecisionTrace</c> on the authority path (EK-08).
///     <c>IDecisionEngineV2.ResolveAsync</c> may materialize <c>DecisionNode[]</c> as a pre-step or unused
///     appendix; it must not write golden manifests itself.
/// </summary>
public interface IDecisionEngine
{
    Task<(ManifestDocument Manifest, DecisionTraceDto Trace)> DecideAsync(
        Guid runId,
        Guid contextSnapshotId,
        GraphSnapshot graphSnapshot,
        FindingsSnapshot findingsSnapshot,
        CancellationToken ct);
}
