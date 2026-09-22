using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Services;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Application.ArchitectureIntelligence;

public sealed class ClosedLoopStrengtheningScoreSyncResult
{
    public int ProjectedFindingCount
    {
        get;
        init;
    }

    public int EnrichedGraphNodeCount
    {
        get;
        init;
    }

    public bool MutedRequiredCapabilityFinding
    {
        get;
        init;
    }

    public bool UpdatedRequiredCapabilityFinding
    {
        get;
        init;
    }
}

public interface IClosedLoopStrengtheningScoreSyncService
{
    ClosedLoopStrengtheningScoreSyncResult SyncScoreSignals(
        ManifestDocument manifest,
        GraphSnapshot graphSnapshot,
        FindingsSnapshot findingsSnapshot);
}

public sealed class ClosedLoopStrengtheningScoreSyncService : IClosedLoopStrengtheningScoreSyncService
{
    public ClosedLoopStrengtheningScoreSyncResult SyncScoreSignals(
        ManifestDocument manifest,
        GraphSnapshot graphSnapshot,
        FindingsSnapshot findingsSnapshot)
    {
        ArgumentNullException.ThrowIfNull(manifest);
        ArgumentNullException.ThrowIfNull(graphSnapshot);
        ArgumentNullException.ThrowIfNull(findingsSnapshot);

        HashSet<string> existingFindingIds = findingsSnapshot.Findings
            .Select(static finding => finding.FindingId)
            .ToHashSet(StringComparer.Ordinal);

        int enrichedGraphNodeCount =
            ClosedLoopManifestGraphTopologyEnricher.EnrichGraphFromManifestTopology(graphSnapshot, manifest);

        ClosedLoopRequiredCapabilityRefreshResult capabilityRefresh =
            ClosedLoopRequiredCapabilityFindingsRefresher.RefreshOpenFinding(findingsSnapshot, graphSnapshot);

        IReadOnlyList<Finding> projectedFindings =
            ClosedLoopManifestFindingsProjector.ProjectSupplementalFindings(manifest, existingFindingIds);

        if (projectedFindings.Count > 0)
        {
            FindingsSnapshotAuthorityMerger.MergeAdditionalFindings(
                findingsSnapshot,
                projectedFindings,
                TimeProvider.System);
        }

        return new ClosedLoopStrengtheningScoreSyncResult
        {
            ProjectedFindingCount = projectedFindings.Count,
            EnrichedGraphNodeCount = enrichedGraphNodeCount,
            MutedRequiredCapabilityFinding = capabilityRefresh.MutedRequiredCapabilityFinding,
            UpdatedRequiredCapabilityFinding = capabilityRefresh.UpdatedRequiredCapabilityFinding,
        };
    }
}
