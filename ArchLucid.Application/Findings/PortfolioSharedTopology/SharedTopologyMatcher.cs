using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.Findings;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;

namespace ArchLucid.Application.Findings.PortfolioSharedTopology;

public sealed class SharedTopologyMatcher(
    IRunDetailQueryService runDetailQueryService,
    IGraphSnapshotRepository graphSnapshotRepository) : ISharedTopologyMatcher
{
    private readonly IRunDetailQueryService _runDetailQueryService =
        runDetailQueryService ?? throw new ArgumentNullException(nameof(runDetailQueryService));

    private readonly IGraphSnapshotRepository _graphSnapshotRepository =
        graphSnapshotRepository ?? throw new ArgumentNullException(nameof(graphSnapshotRepository));

    public async Task<IReadOnlyList<SharedTopologyConflict>> MatchAsync(
        ScopeContext scope,
        GraphSnapshot currentGraph,
        IReadOnlyList<KeyValuePair<string, RunSummary>> scannedSystems,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(currentGraph);
        ArgumentNullException.ThrowIfNull(scannedSystems);

        IReadOnlyList<SharedResourcePostureEntry> currentEntries = SharedResourcePostureCollector.Collect(currentGraph);

        if (currentEntries.Count == 0)
        {
            return [];
        }

        string currentRunId = currentGraph.RunId.ToString("N");
        List<SharedTopologyConflict> conflicts = [];

        foreach ((string systemName, RunSummary summary) in scannedSystems)
        {
            if (string.Equals(summary.RunId, currentRunId, StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            GraphSnapshot? peerGraph = await TryLoadPeerGraphAsync(scope, summary.RunId, cancellationToken).ConfigureAwait(false);

            if (peerGraph is null)
            {
                continue;
            }

            IReadOnlyList<SharedResourcePostureEntry> peerEntries = SharedResourcePostureCollector.Collect(peerGraph);

            foreach (SharedResourcePostureEntry currentEntry in currentEntries)
            {
                foreach (SharedResourcePostureEntry peerEntry in peerEntries)
                {
                    if (!string.Equals(
                            currentEntry.ResourceIdNormalized,
                            peerEntry.ResourceIdNormalized,
                            StringComparison.OrdinalIgnoreCase))
                    {
                        continue;
                    }

                    if (string.Equals(currentEntry.PostureCode, peerEntry.PostureCode, StringComparison.Ordinal))
                    {
                        continue;
                    }

                    conflicts.Add(new SharedTopologyConflict
                    {
                        CurrentEntry = currentEntry,
                        OtherSystemId = systemName,
                        OtherRunId = summary.RunId,
                        OtherPostureCode = peerEntry.PostureCode,
                    });
                }
            }
        }

        return conflicts;
    }

    private async Task<GraphSnapshot?> TryLoadPeerGraphAsync(
        ScopeContext scope,
        string runId,
        CancellationToken cancellationToken)
    {
        ArchitectureRunDetail? detail = await _runDetailQueryService
            .GetRunDetailForRoiAsync(runId, cancellationToken)
            .ConfigureAwait(false);

        if (detail?.Run.GraphSnapshotId is not Guid graphSnapshotId || graphSnapshotId == Guid.Empty)
        {
            return null;
        }

        return await _graphSnapshotRepository
            .GetByIdAsync(scope, graphSnapshotId, cancellationToken)
            .ConfigureAwait(false);
    }
}
