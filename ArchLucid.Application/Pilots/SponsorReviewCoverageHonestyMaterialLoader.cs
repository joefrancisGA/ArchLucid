using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Application.Pilots;

/// <summary>Loads sponsor export honesty inputs from committed run detail (CD-15).</summary>
public static class SponsorReviewCoverageHonestyMaterialLoader
{
    public static async Task<SponsorReviewCoverageHonestyContext> LoadAsync(
        ArchitectureRunDetail detail,
        IAuthorityQueryService authorityQueryService,
        IGraphSnapshotRepository graphSnapshotRepository,
        ScopeContext scope,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(detail);
        ArgumentNullException.ThrowIfNull(authorityQueryService);
        ArgumentNullException.ThrowIfNull(graphSnapshotRepository);
        ArgumentNullException.ThrowIfNull(scope);

        ArchitectureRun run = detail.Run ?? throw new ArgumentException("Run detail is missing run metadata.", nameof(detail));
        string runId = run.RunId.Trim();
        FeasibilityVerdict? verdict = await TryLoadFeasibilityVerdictAsync(
            runId,
            authorityQueryService,
            scope,
            cancellationToken);
        bool analysisStagesComplete = AnalysisStagesComplete(run);
        int actorNodeCount = await CountActorNodesAsync(run, graphSnapshotRepository, scope, cancellationToken);

        return new SponsorReviewCoverageHonestyContext(runId, verdict, analysisStagesComplete, actorNodeCount);
    }

    private static bool AnalysisStagesComplete(ArchitectureRun run) =>
        !string.IsNullOrWhiteSpace(run.ContextSnapshotId)
        && run.GraphSnapshotId is not null
        && run.FindingsSnapshotId is not null;

    private static async Task<FeasibilityVerdict?> TryLoadFeasibilityVerdictAsync(
        string runId,
        IAuthorityQueryService authorityQueryService,
        ScopeContext scope,
        CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(runId, out Guid runGuid))
        {
            return null;
        }

        RunDetailDto? exportDetail = await authorityQueryService
            .GetRunDetailForExportAsync(scope, runGuid, cancellationToken)
            .ConfigureAwait(false);

        return exportDetail?.GoldenManifest?.FeasibilityVerdict;
    }

    private static async Task<int> CountActorNodesAsync(
        ArchitectureRun run,
        IGraphSnapshotRepository graphSnapshotRepository,
        ScopeContext scope,
        CancellationToken cancellationToken)
    {
        if (run.GraphSnapshotId is not { } graphSnapshotId)
        {
            return 0;
        }

        GraphSnapshot? graphSnapshot = await graphSnapshotRepository
            .GetByIdAsync(scope, graphSnapshotId, cancellationToken)
            .ConfigureAwait(false);

        if (graphSnapshot is null)
        {
            return 0;
        }

        return graphSnapshot.GetNodesByType(GraphNodeTypes.Actor).Count;
    }
}
