using ArchLucid.Contracts.Agents;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application;

public sealed partial class RunDetailQueryService
{
    private async Task ApplySemanticSupportBandOverlaysAndLaneBComposeAsync(
        string runId,
        ScopeContext scope,
        IReadOnlyList<AgentResult> results,
        Guid? findingsSnapshotId,
        CancellationToken cancellationToken)
    {
        if (findingsSnapshotId is { } snapshotId && _semanticSupportBandOverlayRepository is not null)
        {
            IReadOnlyDictionary<string, Core.Persistence.FindingSemanticSupportBandOverlayRecord> supportBandOverlays =
                await _semanticSupportBandOverlayRepository
                    .GetBySnapshotAsync(snapshotId, scope, cancellationToken)
                    .ConfigureAwait(false);

            if (supportBandOverlays.Count > 0)
                Findings.FindingSemanticSupportBandOverlayApplier.ApplyToAgentResults(results, supportBandOverlays);
        }

        if (_semanticSupportBandLaneBComposeService is not null)
        {
            await _semanticSupportBandLaneBComposeService
                .ApplyToAgentResultsAsync(runId, scope, results, cancellationToken)
                .ConfigureAwait(false);
        }
    }
}
