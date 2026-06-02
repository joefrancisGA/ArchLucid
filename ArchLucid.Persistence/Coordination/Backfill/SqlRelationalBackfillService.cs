using System.Diagnostics.CodeAnalysis;

using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Persistence.Artifacts;
using ArchLucid.Contracts.Persistence.Context;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Data.Infrastructure;
using ArchLucid.Persistence.Repositories;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Persistence.Coordination.Backfill;

/// <summary>
///     Scans authority tables for JSON-only rows, hydrates domain models (same paths as repositories), and inserts
///     missing relational slices. Safe to re-run: each slice insert is skipped when child rows already exist.
/// </summary>
[ExcludeFromCodeCoverage(Justification =
    "Entirely SQL-dependent; every method runs Dapper queries and transactions against live SQL Server.")]
public sealed class SqlRelationalBackfillService(
    ISqlConnectionFactory connectionFactory,
    SqlContextSnapshotRepository contextSnapshotRepository,
    SqlGraphSnapshotRepository graphSnapshotRepository,
    SqlFindingsSnapshotRepository findingsSnapshotRepository,
    SqlGoldenManifestRepository goldenManifestRepository,
    SqlArtifactBundleRepository artifactBundleRepository,
    IGraphSnapshotProjectionCache graphSnapshotProjectionCache,
    ILogger<SqlRelationalBackfillService> logger) : ISqlRelationalBackfillService
{
    private readonly SqlRelationalBackfillCheckpointStore _checkpoints = new(connectionFactory);
    private readonly SqlRelationalBackfillFailureQuarantineStore _quarantine = new(connectionFactory);

    public async Task<SqlRelationalBackfillReport> RunAsync(SqlRelationalBackfillOptions options, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(options);
        SqlRelationalBackfillReport report = new();

        if (options.ContextSnapshots)
        {
            await SqlRelationalBackfillStageRunner.RunTrackedStageAsync(
                "ContextSnapshots",
                report,
                () => BackfillContextSnapshotsAsync(options, report, ct),
                ct);
        }

        if (options.GraphSnapshots)
        {
            await SqlRelationalBackfillStageRunner.RunTrackedStageAsync(
                "GraphSnapshots",
                report,
                () => BackfillGraphSnapshotsAsync(options, report, ct),
                ct);
        }

        if (options.FindingsSnapshots)
        {
            await SqlRelationalBackfillStageRunner.RunTrackedStageAsync(
                "FindingsSnapshots",
                report,
                () => BackfillFindingsSnapshotsAsync(options, report, ct),
                ct);
        }

        if (options.GoldenManifestsPhase1)
        {
            await SqlRelationalBackfillStageRunner.RunTrackedStageAsync(
                "GoldenManifestsPhase1",
                report,
                () => BackfillGoldenManifestsAsync(options, report, ct),
                ct);
        }

        if (options.ArtifactBundles)
        {
            await SqlRelationalBackfillStageRunner.RunTrackedStageAsync(
                "ArtifactBundles",
                report,
                () => BackfillArtifactBundlesAsync(options, report, ct),
                ct);
        }

        return report;
    }

    private Task BackfillContextSnapshotsAsync(
        SqlRelationalBackfillOptions options,
        SqlRelationalBackfillReport report,
        CancellationToken ct) =>
        SqlRelationalBackfillStageProcessor.ProcessGuidStageAsync(
            "ContextSnapshots",
            options,
            report,
            connectionFactory,
            _checkpoints,
            _quarantine,
            "dbo.ContextSnapshots",
            "SnapshotId",
            (snapshotId, token) => ProcessContextSnapshotAsync(snapshotId, token),
            logger,
            ct);

    private async Task ProcessContextSnapshotAsync(Guid snapshotId, CancellationToken ct)
    {
        await using Microsoft.Data.SqlClient.SqlConnection conn = await connectionFactory.CreateOpenConnectionAsync(ct);
        await using Microsoft.Data.SqlClient.SqlTransaction tx = conn.BeginTransaction();

        ContextSnapshot? snapshot = await contextSnapshotRepository.GetByIdAsync(
            ScopedRepositoryScopeValidation.TrustedJobScope,
            snapshotId,
            conn,
            tx,
            ct);

        if (snapshot is null)
        {
            tx.Commit();

            return;
        }

        await SqlContextSnapshotRepository.BackfillRelationalSlicesAsync(snapshot, conn, tx, ct);
        tx.Commit();
    }

    private Task BackfillGraphSnapshotsAsync(
        SqlRelationalBackfillOptions options,
        SqlRelationalBackfillReport report,
        CancellationToken ct) =>
        SqlRelationalBackfillStageProcessor.ProcessGuidStageAsync(
            "GraphSnapshots",
            options,
            report,
            connectionFactory,
            _checkpoints,
            _quarantine,
            "dbo.GraphSnapshots",
            "GraphSnapshotId",
            (graphSnapshotId, token) => ProcessGraphSnapshotAsync(graphSnapshotId, token),
            logger,
            ct);

    private async Task ProcessGraphSnapshotAsync(Guid graphSnapshotId, CancellationToken ct)
    {
        await using Microsoft.Data.SqlClient.SqlConnection conn = await connectionFactory.CreateOpenConnectionAsync(ct);
        await using Microsoft.Data.SqlClient.SqlTransaction tx = conn.BeginTransaction();

        GraphSnapshot? snapshot = await graphSnapshotRepository.GetByIdAsync(
            ScopedRepositoryScopeValidation.TrustedJobScope,
            graphSnapshotId,
            conn,
            tx,
            ct);

        if (snapshot is null)
        {
            tx.Commit();

            return;
        }

        await SqlGraphSnapshotRepository.BackfillRelationalSlicesAsync(snapshot, conn, tx, ct);
        tx.Commit();
        await TryInvalidateGraphProjectionAfterGraphBackfillAsync(snapshot, ct);
    }

    private Task BackfillFindingsSnapshotsAsync(
        SqlRelationalBackfillOptions options,
        SqlRelationalBackfillReport report,
        CancellationToken ct) =>
        SqlRelationalBackfillStageProcessor.ProcessGuidStageAsync(
            "FindingsSnapshots",
            options,
            report,
            connectionFactory,
            _checkpoints,
            _quarantine,
            "dbo.FindingsSnapshots",
            "FindingsSnapshotId",
            (findingsSnapshotId, token) => ProcessFindingsSnapshotAsync(findingsSnapshotId, token),
            logger,
            ct);

    private async Task ProcessFindingsSnapshotAsync(Guid findingsSnapshotId, CancellationToken ct)
    {
        await using Microsoft.Data.SqlClient.SqlConnection conn = await connectionFactory.CreateOpenConnectionAsync(ct);
        await using Microsoft.Data.SqlClient.SqlTransaction tx = conn.BeginTransaction();

        FindingsSnapshot? snapshot = await findingsSnapshotRepository.GetByIdAsync(
            ScopedRepositoryScopeValidation.TrustedJobScope,
            findingsSnapshotId,
            ct);

        if (snapshot is null)
        {
            tx.Commit();

            return;
        }

        // TB-087: idempotency and duplicate prevention rely on repository transaction + UQ_FindingRecords_Snapshot_FindingId.
        await SqlFindingsSnapshotRepository.BackfillRelationalSlicesAsync(snapshot, conn, tx, ct);
        tx.Commit();
    }

    private async Task BackfillGoldenManifestsAsync(
        SqlRelationalBackfillOptions options,
        SqlRelationalBackfillReport report,
        CancellationToken ct)
    {
        const string stage = "GoldenManifestsPhase1";
        SqlRelationalBackfillCursor cursor = await _checkpoints.GetCursorAsync(stage, ct);

        while (!ct.IsCancellationRequested)
        {
            IReadOnlyList<SqlRelationalBackfillGoldenManifestPageRow> page =
                await SqlRelationalBackfillPagedEntityLoader.LoadGoldenManifestPageAsync(
                    connectionFactory,
                    cursor,
                    options.BatchSize,
                    ct);

            if (page.Count == 0)
                break;

            SqlRelationalBackfillCursor checkpointCandidate = cursor;
            bool stopPage = false;

            foreach (SqlRelationalBackfillGoldenManifestPageRow row in page)
            {
                string entityKey = row.ManifestId.ToString("D");
                SqlRelationalBackfillCursor rowCursor = new(row.CreatedUtc, row.ManifestId);

                if (await _quarantine.ShouldSkipAsync(stage, entityKey, options.MaxRetries, options.ForceRetry, ct))
                {
                    report.SkippedQuarantinedCount++;
                    checkpointCandidate = rowCursor;

                    continue;
                }

                report.ProcessedCount++;

                try
                {
                    ScopeContext scope = new()
                    {
                        TenantId = row.TenantId, WorkspaceId = row.WorkspaceId, ProjectId = row.ProjectId
                    };

                    ManifestDocument? manifest = await goldenManifestRepository.GetByIdAsync(scope, row.ManifestId, ct);

                    if (manifest is null)
                    {
                        report.SuccessCount++;
                        checkpointCandidate = rowCursor;

                        continue;
                    }

                    await using Microsoft.Data.SqlClient.SqlConnection conn =
                        await connectionFactory.CreateOpenConnectionAsync(ct);
                    await using Microsoft.Data.SqlClient.SqlTransaction tx = conn.BeginTransaction();

                    await SqlGoldenManifestRepository.BackfillPhase1RelationalSlicesAsync(manifest, conn, tx, ct);
                    tx.Commit();
                    report.SuccessCount++;
                    await _quarantine.ClearAsync(stage, entityKey, ct);
                    checkpointCandidate = rowCursor;
                    logger.LogInformation("Backfill GoldenManifests: completed {ManifestId}", row.ManifestId);
                }
                catch (Exception ex) when (!ct.IsCancellationRequested)
                {
                    report.FailureCount++;
                    report.Failures.Add(
                        new SqlRelationalBackfillFailure
                        {
                            Stage = stage, EntityKey = entityKey, Message = ex.Message
                        });

                    await _quarantine.RecordFailureAsync(stage, entityKey, ex.Message, options.MaxRetries, ct);
                    logger.LogError(ex, "Backfill GoldenManifests: failed {ManifestId}", row.ManifestId);
                    stopPage = true;

                    break;
                }
            }

            cursor = checkpointCandidate;
            await _checkpoints.SaveCursorAsync(stage, cursor, ct);

            if (stopPage || page.Count < options.BatchSize)
                break;
        }
    }

    private Task BackfillArtifactBundlesAsync(
        SqlRelationalBackfillOptions options,
        SqlRelationalBackfillReport report,
        CancellationToken ct) =>
        SqlRelationalBackfillStageProcessor.ProcessGuidStageAsync(
            "ArtifactBundles",
            options,
            report,
            connectionFactory,
            _checkpoints,
            _quarantine,
            "dbo.ArtifactBundles",
            "BundleId",
            (bundleId, token) => ProcessArtifactBundleAsync(bundleId, token),
            logger,
            ct);

    private async Task ProcessArtifactBundleAsync(Guid bundleId, CancellationToken ct)
    {
        ArtifactBundle? bundle = await artifactBundleRepository.GetByBundleIdAsync(bundleId, ct);

        if (bundle is null)
            return;

        await using Microsoft.Data.SqlClient.SqlConnection conn = await connectionFactory.CreateOpenConnectionAsync(ct);
        await using Microsoft.Data.SqlClient.SqlTransaction tx = conn.BeginTransaction();

        await SqlArtifactBundleRepository.BackfillRelationalSlicesAsync(bundle, conn, tx, ct);
        tx.Commit();
    }

    private async Task TryInvalidateGraphProjectionAfterGraphBackfillAsync(GraphSnapshot snapshot, CancellationToken ct)
    {
        ScopeContext? scope = await TryResolveRunScopeAsync(snapshot.RunId, ct);

        if (scope is null)
        {
            logger.LogWarning(
                "Graph backfill: skipped projection cache invalidation (Runs row missing for RunId={RunId}, GraphSnapshotId={GraphSnapshotId})",
                snapshot.RunId,
                snapshot.GraphSnapshotId);

            return;
        }

        graphSnapshotProjectionCache.Invalidate(scope, snapshot.RunId, snapshot.GraphSnapshotId);
    }

    private async Task<ScopeContext?> TryResolveRunScopeAsync(Guid runId, CancellationToken ct)
    {
        await using Microsoft.Data.SqlClient.SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct);

        List<(Guid TenantId, Guid WorkspaceId, Guid ScopeProjectId)> matches =
            (await Dapper.SqlMapper.QueryAsync<(Guid TenantId, Guid WorkspaceId, Guid ScopeProjectId)>(
                connection,
                new Dapper.CommandDefinition(
                    """
                    SELECT TenantId, WorkspaceId, ScopeProjectId
                    FROM dbo.Runs
                    WHERE RunId = @RunId;
                    """,
                    new { RunId = runId },
                    cancellationToken: ct))).ToList();

        if (matches.Count == 0)
            return null;

        (Guid tenantId, Guid workspaceId, Guid scopeProjectId) = matches[0];

        return new ScopeContext
        {
            TenantId = tenantId, WorkspaceId = workspaceId, ProjectId = scopeProjectId
        };
    }
}
