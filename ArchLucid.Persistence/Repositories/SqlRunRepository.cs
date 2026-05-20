using System.Data;
using System.Diagnostics;
using System.Diagnostics.CodeAnalysis;

using ArchLucid.Contracts.Common;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Pagination;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Data.Infrastructure;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Sql;
using ArchLucid.Persistence.Telemetry;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Repositories;

/// <summary>
///     SQL Server-backed implementation of <see cref="IRunRepository" />.
///     Persists and retrieves <see cref="RunRecord" /> rows from the <c>dbo.Runs</c> table.
///     All read operations are scoped to the caller's tenant, workspace, and project.
/// </summary>
[ExcludeFromCodeCoverage(Justification = "SQL-dependent repository; requires live SQL Server for integration testing.")]
public sealed class SqlRunRepository(
    ISqlConnectionFactory connectionFactory,
    IAuthorityRunListConnectionFactory authorityRunListConnectionFactory,
    ITenantRepository tenantRepository) : IRunRepository
{
    private readonly ITenantRepository _tenantRepository =
        tenantRepository ?? throw new ArgumentNullException(nameof(tenantRepository));

    public async Task SaveAsync(
        RunRecord run,
        CancellationToken ct,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null)
    {
        ArgumentNullException.ThrowIfNull(run);
        ScopedRepositoryScopeValidation.RequireEntityTenant(run.TenantId);

        const string sql = """
                           INSERT INTO dbo.Runs
                           (
                               RunId, TenantId, WorkspaceId, ScopeProjectId, ProjectId, Description, CreatedUtc,
                               ContextSnapshotId, GraphSnapshotId, FindingsSnapshotId,
                               GoldenManifestId, DecisionTraceId, ArtifactBundleId, ArchivedUtc,
                               ArchitectureRequestId, LegacyRunStatus, CompletedUtc, CurrentManifestVersion, OtelTraceId,
                               IsDemoWelcomeRun, IsPublicShowcase, IsPinned, RealModeFellBackToSimulator, PilotAoaiDeploymentSnapshot,
                               StructuralExecutionMode,
                               RetryCount, LastFailureReason
                           )
                           OUTPUT inserted.RowVersionStamp
                           VALUES
                           (
                               @RunId, @TenantId, @WorkspaceId, @ScopeProjectId, @ProjectId, @Description, @CreatedUtc,
                               @ContextSnapshotId, @GraphSnapshotId, @FindingsSnapshotId,
                               @GoldenManifestId, @DecisionTraceId, @ArtifactBundleId, @ArchivedUtc,
                               @ArchitectureRequestId, @LegacyRunStatus, @CompletedUtc, @CurrentManifestVersion, @OtelTraceId,
                               @IsDemoWelcomeRun, @IsPublicShowcase, @IsPinned, @RealModeFellBackToSimulator, @PilotAoaiDeploymentSnapshot,
                               @StructuralExecutionMode,
                               @RetryCount, @LastFailureReason
                           );
                           """;

        object insertParams = CreateRunInsertParameters(run);

        if (connection is not null)
        {
            await _tenantRepository.TryIncrementActiveTrialRunAsync(run.TenantId, ct, connection, transaction);

            byte[] stamp = await connection.QuerySingleAsync<byte[]>(
                new CommandDefinition(sql, insertParams, transaction, cancellationToken: ct));
            run.RowVersion = stamp;

            return;
        }

        await using SqlConnection owned = await connectionFactory.CreateOpenConnectionAsync(ct);
        await using SqlTransaction tran = (SqlTransaction)await owned.BeginTransactionAsync(ct);

        try
        {
            await _tenantRepository.TryIncrementActiveTrialRunAsync(run.TenantId, ct, owned, tran);

            byte[] ownedStamp =
                await owned.QuerySingleAsync<byte[]>(new CommandDefinition(sql, insertParams, tran, cancellationToken: ct));
            run.RowVersion = ownedStamp;
            await tran.CommitAsync(ct);
        }
        catch
        {
            await tran.RollbackAsync(ct);
            throw;
        }
    }

    public async Task<RunRecord?> GetByIdAsync(ScopeContext scope, Guid runId, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ScopedRepositoryScopeValidation.RequireScopedTenant(scope);

        Stopwatch sw = Stopwatch.StartNew();

        try
        {
            const string sql = """
                               SELECT
                                   RunId, TenantId, WorkspaceId, ScopeProjectId, ProjectId, Description, CreatedUtc,
                                   ContextSnapshotId, GraphSnapshotId, FindingsSnapshotId,
                                   GoldenManifestId, DecisionTraceId, ArtifactBundleId, ArchivedUtc,
                                   ArchitectureRequestId, LegacyRunStatus, CompletedUtc, CurrentManifestVersion, OtelTraceId,
                                   IsDemoWelcomeRun, IsPublicShowcase, IsPinned, RealModeFellBackToSimulator, PilotAoaiDeploymentSnapshot,
                                   StructuralExecutionMode,
                                   RetryCount, LastFailureReason,
                                   RowVersionStamp AS RowVersion,
                                   CASE WHEN EXISTS (SELECT 1 FROM dbo.FindingsSnapshots fs WITH (NOLOCK) WHERE fs.RunId = dbo.Runs.RunId AND fs.ArchivedUtc IS NULL AND fs.HasWarnings = 1) THEN 1 ELSE 0 END AS HasWarnings,
                                   CASE WHEN EXISTS (SELECT 1 FROM dbo.AlertRecords ar WITH (NOLOCK) WHERE ar.RunId = dbo.Runs.RunId AND ar.Status = 'Open') THEN 1 ELSE 0 END AS HasGovernanceWarnings
                               FROM dbo.Runs
                               WHERE RunId = @RunId
                                 AND TenantId = @TenantId
                                 AND WorkspaceId = @WorkspaceId
                                 AND ScopeProjectId = @ScopeProjectId
                                 AND ArchivedUtc IS NULL;
                               """;

            await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct);

            return await connection.QuerySingleOrDefaultAsync<RunRecord>(
                new CommandDefinition(
                    sql,
                    new
                    {
                        RunId = runId,
                        scope.TenantId,
                        scope.WorkspaceId,
                        ScopeProjectId = scope.ProjectId
                    },
                    cancellationToken: ct));
        }
        finally
        {
            ArchLucidInstrumentation.RecordNamedQueryLatencyMilliseconds(
                NamedQueryTelemetryNames.GetRunByScopedId,
                sw.Elapsed.TotalMilliseconds);
        }
    }

    public async Task<RunRecord?> GetByRunIdAdminAsync(Guid runId, CancellationToken ct)
    {
        Stopwatch sw = Stopwatch.StartNew();

        try
        {
            const string sql = """
                               SELECT TOP (1)
                                   RunId, TenantId, WorkspaceId, ScopeProjectId, ProjectId, Description, CreatedUtc,
                                   ContextSnapshotId, GraphSnapshotId, FindingsSnapshotId,
                                   GoldenManifestId, DecisionTraceId, ArtifactBundleId, ArchivedUtc,
                                   ArchitectureRequestId, LegacyRunStatus, CompletedUtc, CurrentManifestVersion, OtelTraceId,
                                   IsDemoWelcomeRun, IsPublicShowcase, IsPinned, RealModeFellBackToSimulator, PilotAoaiDeploymentSnapshot,
                                   StructuralExecutionMode,
                                   RetryCount, LastFailureReason,
                                   RowVersionStamp AS RowVersion,
                                   CASE WHEN EXISTS (SELECT 1 FROM dbo.FindingsSnapshots fs WITH (NOLOCK) WHERE fs.RunId = dbo.Runs.RunId AND fs.ArchivedUtc IS NULL AND fs.HasWarnings = 1) THEN 1 ELSE 0 END AS HasWarnings,
                                   CASE WHEN EXISTS (SELECT 1 FROM dbo.AlertRecords ar WITH (NOLOCK) WHERE ar.RunId = dbo.Runs.RunId AND ar.Status = 'Open') THEN 1 ELSE 0 END AS HasGovernanceWarnings
                               FROM dbo.Runs
                               WHERE RunId = @RunId
                                 AND ArchivedUtc IS NULL;
                               """;

            await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct);

            return await connection.QuerySingleOrDefaultAsync<RunRecord>(
                new CommandDefinition(sql, new
                {
                    RunId = runId
                }, cancellationToken: ct));
        }
        finally
        {
            ArchLucidInstrumentation.RecordNamedQueryLatencyMilliseconds(
                NamedQueryTelemetryNames.GetRunByIdAdmin,
                sw.Elapsed.TotalMilliseconds);
        }
    }

    public async Task<RunRecord?> GetLatestWithGraphAtOrBeforeAsync(
        ScopeContext scope,
        string authorityProjectSlug,
        DateTime asOfUtc,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(authorityProjectSlug);
        ScopedRepositoryScopeValidation.RequireScopedTenant(scope);

        Stopwatch sw = Stopwatch.StartNew();

        try
        {
            const string sql = """
                               SELECT TOP (1)
                                   RunId, TenantId, WorkspaceId, ScopeProjectId, ProjectId, Description, CreatedUtc,
                                   ContextSnapshotId, GraphSnapshotId, FindingsSnapshotId,
                                   GoldenManifestId, DecisionTraceId, ArtifactBundleId, ArchivedUtc,
                                   ArchitectureRequestId, LegacyRunStatus, CompletedUtc, CurrentManifestVersion, OtelTraceId,
                                   IsDemoWelcomeRun, IsPublicShowcase, IsPinned, RealModeFellBackToSimulator, PilotAoaiDeploymentSnapshot,
                                   StructuralExecutionMode,
                                   RetryCount, LastFailureReason,
                                   RowVersionStamp AS RowVersion,
                                   CASE WHEN EXISTS (SELECT 1 FROM dbo.FindingsSnapshots fs WITH (NOLOCK) WHERE fs.RunId = dbo.Runs.RunId AND fs.ArchivedUtc IS NULL AND fs.HasWarnings = 1) THEN 1 ELSE 0 END AS HasWarnings,
                                   CASE WHEN EXISTS (SELECT 1 FROM dbo.AlertRecords ar WITH (NOLOCK) WHERE ar.RunId = dbo.Runs.RunId AND ar.Status = 'Open') THEN 1 ELSE 0 END AS HasGovernanceWarnings
                               FROM dbo.Runs
                               WHERE TenantId = @TenantId
                                 AND WorkspaceId = @WorkspaceId
                                 AND ScopeProjectId = @ScopeProjectId
                                 AND ProjectId = @AuthorityProjectSlug
                                 AND ArchivedUtc IS NULL
                                 AND GraphSnapshotId IS NOT NULL
                                 AND CreatedUtc <= @AsOfUtc
                               ORDER BY CreatedUtc DESC, RunId DESC;
                               """;

            await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct);

            return await connection.QuerySingleOrDefaultAsync<RunRecord>(
                new CommandDefinition(
                    sql,
                    new
                    {
                        scope.TenantId,
                        scope.WorkspaceId,
                        ScopeProjectId = scope.ProjectId,
                        AuthorityProjectSlug = authorityProjectSlug,
                        AsOfUtc = DateTime.SpecifyKind(asOfUtc, DateTimeKind.Utc)
                    },
                    cancellationToken: ct));
        }
        finally
        {
            ArchLucidInstrumentation.RecordNamedQueryLatencyMilliseconds(
                NamedQueryTelemetryNames.GetLatestRunWithGraphAtOrBefore,
                sw.Elapsed.TotalMilliseconds);
        }
    }

    public async Task<IReadOnlyList<RunRecord>> ListByProjectAsync(
        ScopeContext scope,
        string projectId,
        int take,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ScopedRepositoryScopeValidation.RequireScopedTenant(scope);

        // NOLOCK: dashboard-grade list on hot-write table; tolerates replica-style staleness (see ListRecentInScopeAsync).

        Stopwatch sw = Stopwatch.StartNew();

        try
        {
            await using SqlConnection connection = await authorityRunListConnectionFactory.CreateOpenConnectionAsync(ct);
            IEnumerable<RunRecord> rows = await connection.QueryAsync<RunRecord>(
                new CommandDefinition(
                    HotPathRelationalQueryShapes.RunsListByProjectNoLock,
                    new
                    {
                        ProjectSlug = projectId,
                        scope.TenantId,
                        scope.WorkspaceId,
                        ScopeProjectId = scope.ProjectId,
                        Take = Math.Clamp(take <= 0 ? 20 : take, 1, 200)
                    },
                    cancellationToken: ct));

            return rows.ToList();
        }
        finally
        {
            ArchLucidInstrumentation.RecordNamedQueryLatencyMilliseconds(
                NamedQueryTelemetryNames.ListRunsByProject,
                sw.Elapsed.TotalMilliseconds);
        }
    }

    public async Task<RunListPage> ListByProjectKeysetAsync(
        ScopeContext scope,
        string projectId,
        DateTime? cursorCreatedUtc,
        Guid? cursorRunId,
        int take,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ValidateRunKeysetCursor(cursorCreatedUtc, cursorRunId);
        ScopedRepositoryScopeValidation.RequireScopedTenant(scope);

        int safeTake = RunPagination.ClampTake(take);
        int fetch = safeTake + 1;

        // NOLOCK: same dashboard-grade tolerance as unpaged lists.

        Stopwatch sw = Stopwatch.StartNew();

        try
        {
            await using SqlConnection connection = await authorityRunListConnectionFactory.CreateOpenConnectionAsync(ct);
            IEnumerable<RunRecord> rowsEnumerable = await connection.QueryAsync<RunRecord>(
                new CommandDefinition(
                    HotPathRelationalQueryShapes.RunsListByProjectKeysetNoLock,
                    new
                    {
                        ProjectSlug = projectId,
                        scope.TenantId,
                        scope.WorkspaceId,
                        ScopeProjectId = scope.ProjectId,
                        Fetch = fetch,
                        CursorCreatedUtc = cursorCreatedUtc,
                        CursorRunId = cursorRunId
                    },
                    cancellationToken: ct));

            List<RunRecord> rows = rowsEnumerable.ToList();
            bool hasMore = rows.Count > safeTake;

            if (hasMore)
                rows.RemoveAt(rows.Count - 1);

            return new RunListPage(rows, hasMore);
        }
        finally
        {
            ArchLucidInstrumentation.RecordNamedQueryLatencyMilliseconds(
                NamedQueryTelemetryNames.ListRunsByProjectKeyset,
                sw.Elapsed.TotalMilliseconds);
        }
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<RunRecord>> ListRecentInScopeAsync(ScopeContext scope, int take,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ScopedRepositoryScopeValidation.RequireScopedTenant(scope);

        Stopwatch sw = Stopwatch.StartNew();

        try
        {
            // NOLOCK: dashboard / picker list; same tolerance as read-replica staleness (see LOAD_TEST_BASELINE.md). Avoids S-lock blocking behind writers on dbo.Runs.

            await using SqlConnection connection = await authorityRunListConnectionFactory.CreateOpenConnectionAsync(ct);
            IEnumerable<RunRecord> rows = await connection.QueryAsync<RunRecord>(
                new CommandDefinition(
                    HotPathRelationalQueryShapes.RunsListRecentInScopeNoLock,
                    new
                    {
                        scope.TenantId,
                        scope.WorkspaceId,
                        ScopeProjectId = scope.ProjectId,
                        Take = Math.Clamp(take <= 0 ? 200 : take, 1, 200)
                    },
                    cancellationToken: ct));

            return rows.ToList();
        }
        finally
        {
            ArchLucidInstrumentation.RecordNamedQueryLatencyMilliseconds(
                NamedQueryTelemetryNames.GetRunsByTenantId,
                sw.Elapsed.TotalMilliseconds);
        }
    }

    /// <inheritdoc />
    public async Task<RunListPage> ListRecentInScopeKeysetAsync(
        ScopeContext scope,
        DateTime? cursorCreatedUtc,
        Guid? cursorRunId,
        int take,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ValidateRunKeysetCursor(cursorCreatedUtc, cursorRunId);
        ScopedRepositoryScopeValidation.RequireScopedTenant(scope);

        int safeTake = RunPagination.ClampTake(take);
        int fetch = safeTake + 1;

        // NOLOCK: keyset continuation for picker/dashboard lists (same tolerance as ListRecentInScopeAsync).

        Stopwatch sw = Stopwatch.StartNew();

        try
        {
            await using SqlConnection connection = await authorityRunListConnectionFactory.CreateOpenConnectionAsync(ct);
            IEnumerable<RunRecord> rowsEnumerable = await connection.QueryAsync<RunRecord>(
                new CommandDefinition(
                    HotPathRelationalQueryShapes.RunsListRecentInScopeKeysetNoLock,
                    new
                    {
                        scope.TenantId,
                        scope.WorkspaceId,
                        ScopeProjectId = scope.ProjectId,
                        Fetch = fetch,
                        CursorCreatedUtc = cursorCreatedUtc,
                        CursorRunId = cursorRunId
                    },
                    cancellationToken: ct));

            List<RunRecord> rows = rowsEnumerable.ToList();
            bool hasMore = rows.Count > safeTake;

            if (hasMore)
                rows.RemoveAt(rows.Count - 1);

            return new RunListPage(rows, hasMore);
        }
        finally
        {
            ArchLucidInstrumentation.RecordNamedQueryLatencyMilliseconds(
                NamedQueryTelemetryNames.ListRunsRecentInScopeKeyset,
                sw.Elapsed.TotalMilliseconds);
        }
    }

    /// <inheritdoc />
    public async Task<RunListPage> ListRecentInScopeOffsetAsync(
        ScopeContext scope,
        int offset,
        int limit,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ScopedRepositoryScopeValidation.RequireScopedTenant(scope);

        int safeLimit = RunPagination.ClampLimit(limit);
        int safeOffset = RunPagination.NormalizeOffset(offset);
        int fetch = safeLimit + 1;

        Stopwatch sw = Stopwatch.StartNew();

        try
        {
            await using SqlConnection connection = await authorityRunListConnectionFactory.CreateOpenConnectionAsync(ct);
            IEnumerable<RunRecord> rowsEnumerable = await connection.QueryAsync<RunRecord>(
                new CommandDefinition(
                    HotPathRelationalQueryShapes.RunsListRecentInScopeOffsetNoLock,
                    new
                    {
                        scope.TenantId,
                        scope.WorkspaceId,
                        ScopeProjectId = scope.ProjectId,
                        Offset = safeOffset,
                        Fetch = fetch
                    },
                    cancellationToken: ct));

            List<RunRecord> rows = rowsEnumerable.ToList();
            bool hasMore = rows.Count > safeLimit;

            if (hasMore)
                rows.RemoveAt(rows.Count - 1);

            return new RunListPage(rows, hasMore);
        }
        finally
        {
            ArchLucidInstrumentation.RecordNamedQueryLatencyMilliseconds(
                NamedQueryTelemetryNames.ListRunsRecentInScopeOffset,
                sw.Elapsed.TotalMilliseconds);
        }
    }

    public async Task UpdateAsync(
        RunRecord run,
        CancellationToken ct,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null)
    {
        ArgumentNullException.ThrowIfNull(run);
        ScopedRepositoryScopeValidation.RequireEntityTenant(run.TenantId);

        const string sql = """
                           UPDATE dbo.Runs
                           SET
                               TenantId = @TenantId,
                               WorkspaceId = @WorkspaceId,
                               ScopeProjectId = @ScopeProjectId,
                               ProjectId = @ProjectId,
                               Description = @Description,
                               ContextSnapshotId = @ContextSnapshotId,
                               GraphSnapshotId = @GraphSnapshotId,
                               FindingsSnapshotId = @FindingsSnapshotId,
                               GoldenManifestId = @GoldenManifestId,
                               DecisionTraceId = @DecisionTraceId,
                               ArtifactBundleId = @ArtifactBundleId,
                               ArchivedUtc = @ArchivedUtc,
                               ArchitectureRequestId = @ArchitectureRequestId,
                               LegacyRunStatus = @LegacyRunStatus,
                               CompletedUtc = @CompletedUtc,
                               CurrentManifestVersion = @CurrentManifestVersion,
                               IsDemoWelcomeRun = @IsDemoWelcomeRun,
                               IsPublicShowcase = @IsPublicShowcase,
                               IsPinned = @IsPinned,
                               RealModeFellBackToSimulator = @RealModeFellBackToSimulator,
                               PilotAoaiDeploymentSnapshot = @PilotAoaiDeploymentSnapshot,
                               StructuralExecutionMode = @StructuralExecutionMode,
                               RetryCount = @RetryCount,
                               LastFailureReason = @LastFailureReason
                           OUTPUT inserted.RowVersionStamp
                           WHERE RunId = @RunId
                             AND TenantId = @TenantId
                             AND WorkspaceId = @WorkspaceId
                             AND ScopeProjectId = @ScopeProjectId
                             AND (@RowVersion IS NULL OR RowVersionStamp = @RowVersion);
                           """;

        if (connection is not null)
        {
            await ApplyUpdateAsync(connection, transaction, run, sql, ct);

            return;
        }

        await using SqlConnection owned = await connectionFactory.CreateOpenConnectionAsync(ct);
        await ApplyUpdateAsync(owned, null, run, sql, ct);
    }

    /// <inheritdoc />
    public async Task<RunArchiveBatchResult> ArchiveRunsCreatedBeforeAsync(DateTimeOffset cutoffUtc,
        CancellationToken ct)
    {
        const string sql = """
                           DECLARE @Archived TABLE (
                               RunId UNIQUEIDENTIFIER NOT NULL,
                               TenantId UNIQUEIDENTIFIER NOT NULL,
                               WorkspaceId UNIQUEIDENTIFIER NOT NULL,
                               ScopeProjectId UNIQUEIDENTIFIER NOT NULL
                           );

                           DECLARE @cntGolden INT = 0;
                           DECLARE @cntFindings INT = 0;
                           DECLARE @cntContext INT = 0;
                           DECLARE @cntGraph INT = 0;
                           DECLARE @cntDecisioning INT = 0;
                           DECLARE @cntArtifact INT = 0;
                           DECLARE @cntAgentTrace INT = 0;
                           DECLARE @cntComparison INT = 0;

                           UPDATE dbo.Runs
                           SET ArchivedUtc = SYSUTCDATETIME()
                           OUTPUT inserted.RunId, inserted.TenantId, inserted.WorkspaceId, inserted.ScopeProjectId
                           INTO @Archived
                           WHERE ArchivedUtc IS NULL AND CreatedUtc < @Cutoff;

                           IF COL_LENGTH(N'dbo.GoldenManifests', N'ArchivedUtc') IS NOT NULL
                           BEGIN
                               UPDATE dbo.GoldenManifests
                               SET ArchivedUtc = SYSUTCDATETIME()
                               WHERE RunId IN (SELECT RunId FROM @Archived) AND ArchivedUtc IS NULL;
                               SET @cntGolden = @cntGolden + @@ROWCOUNT;
                           END;

                           IF COL_LENGTH(N'dbo.FindingsSnapshots', N'ArchivedUtc') IS NOT NULL
                           BEGIN
                               UPDATE dbo.FindingsSnapshots
                               SET ArchivedUtc = SYSUTCDATETIME()
                               WHERE RunId IN (SELECT RunId FROM @Archived) AND ArchivedUtc IS NULL;
                               SET @cntFindings = @cntFindings + @@ROWCOUNT;
                           END;

                           IF COL_LENGTH(N'dbo.ContextSnapshots', N'ArchivedUtc') IS NOT NULL
                           BEGIN
                               UPDATE dbo.ContextSnapshots
                               SET ArchivedUtc = SYSUTCDATETIME()
                               WHERE RunId IN (SELECT RunId FROM @Archived) AND ArchivedUtc IS NULL;
                               SET @cntContext = @cntContext + @@ROWCOUNT;
                           END;

                           IF COL_LENGTH(N'dbo.GraphSnapshots', N'ArchivedUtc') IS NOT NULL
                           BEGIN
                               UPDATE dbo.GraphSnapshots
                               SET ArchivedUtc = SYSUTCDATETIME()
                               WHERE RunId IN (SELECT RunId FROM @Archived) AND ArchivedUtc IS NULL;
                               SET @cntGraph = @cntGraph + @@ROWCOUNT;
                           END;

                           IF COL_LENGTH(N'dbo.DecisioningTraces', N'ArchivedUtc') IS NOT NULL
                           BEGIN
                               UPDATE dbo.DecisioningTraces
                               SET ArchivedUtc = SYSUTCDATETIME()
                               WHERE RunId IN (SELECT RunId FROM @Archived) AND ArchivedUtc IS NULL;
                               SET @cntDecisioning = @cntDecisioning + @@ROWCOUNT;
                           END;

                           IF COL_LENGTH(N'dbo.ArtifactBundles', N'ArchivedUtc') IS NOT NULL
                           BEGIN
                               UPDATE dbo.ArtifactBundles
                               SET ArchivedUtc = SYSUTCDATETIME()
                               WHERE RunId IN (SELECT RunId FROM @Archived) AND ArchivedUtc IS NULL;
                               SET @cntArtifact = @cntArtifact + @@ROWCOUNT;
                           END;

                           IF COL_LENGTH(N'dbo.AgentExecutionTraces', N'ArchivedUtc') IS NOT NULL
                           BEGIN
                               UPDATE dbo.AgentExecutionTraces
                               SET ArchivedUtc = SYSUTCDATETIME()
                               WHERE ArchivedUtc IS NULL
                                 AND TRY_CAST(RunId AS UNIQUEIDENTIFIER) IN (SELECT RunId FROM @Archived);
                               SET @cntAgentTrace = @cntAgentTrace + @@ROWCOUNT;
                           END;

                           IF COL_LENGTH(N'dbo.ComparisonRecords', N'ArchivedUtc') IS NOT NULL
                           BEGIN
                               UPDATE dbo.ComparisonRecords
                               SET ArchivedUtc = SYSUTCDATETIME()
                               WHERE ArchivedUtc IS NULL
                                 AND (
                                     TRY_CAST(LeftRunId AS UNIQUEIDENTIFIER) IN (SELECT RunId FROM @Archived)
                                     OR TRY_CAST(RightRunId AS UNIQUEIDENTIFIER) IN (SELECT RunId FROM @Archived));
                               SET @cntComparison = @cntComparison + @@ROWCOUNT;
                           END;

                           SELECT RunId, TenantId, WorkspaceId, ScopeProjectId FROM @Archived;
                           SELECT
                               @cntGolden AS GoldenManifests,
                               @cntFindings AS FindingsSnapshots,
                               @cntContext AS ContextSnapshots,
                               @cntGraph AS GraphSnapshots,
                               @cntDecisioning AS DecisioningTraces,
                               @cntArtifact AS ArtifactBundles,
                               @cntAgentTrace AS AgentExecutionTraces,
                               @cntComparison AS ComparisonRecords;
                           """;

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct);
        await using SqlTransaction tran = (SqlTransaction)await connection.BeginTransactionAsync(ct);

        try
        {
            await using SqlMapper.GridReader multi = await connection.QueryMultipleAsync(
                new CommandDefinition(
                    sql,
                    new
                    {
                        Cutoff = cutoffUtc.UtcDateTime
                    },
                    tran,
                    cancellationToken: ct));

            List<ArchivedRunScopeRow> rows = (await multi.ReadAsync<ArchivedRunScopeRow>()).ToList();
            RunArchiveChildCascadeCounts childCascade = (await multi.ReadAsync<RunArchiveChildCascadeCounts>()).Single();

            await tran.CommitAsync(ct);

            return new RunArchiveBatchResult { UpdatedCount = rows.Count, ArchivedRuns = rows, ChildCascade = childCascade };
        }
        catch
        {
            await tran.RollbackAsync(ct);
            throw;
        }
    }

    /// <inheritdoc />
    public async Task<RunArchiveByIdsResult> ArchiveRunsByIdsAsync(IReadOnlyList<Guid> runIds, CancellationToken ct)
    {
        if (runIds.Count == 0)
            return new RunArchiveByIdsResult();

        List<Guid> distinctOrdered = [];
        HashSet<Guid> seen = [];

        distinctOrdered.AddRange(runIds.Where(seen.Add));

        const string selectSql = """
                                 SELECT RunId, ArchivedUtc
                                 FROM dbo.Runs
                                 WHERE RunId IN @RunIds;
                                 """;

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct);
        IEnumerable<(Guid RunId, DateTime? ArchivedUtc)> existingRows =
            await connection.QueryAsync<(Guid RunId, DateTime? ArchivedUtc)>(
                new CommandDefinition(selectSql, new
                {
                    RunIds = distinctOrdered
                }, cancellationToken: ct));

        Dictionary<Guid, DateTime?> stateById =
            existingRows.ToDictionary(static r => r.RunId, static r => r.ArchivedUtc);

        List<Guid> toArchive = [];
        List<RunArchiveByIdFailure> failed = [];

        foreach (Guid id in distinctOrdered)
        {
            if (!stateById.TryGetValue(id, out DateTime? archivedUtc))
            {
                failed.Add(new RunArchiveByIdFailure(id, "Run not found."));
                continue;
            }

            if (archivedUtc.HasValue)
            {
                failed.Add(new RunArchiveByIdFailure(id, "Run already archived."));
                continue;
            }

            toArchive.Add(id);
        }

        if (toArchive.Count == 0)

            return new RunArchiveByIdsResult { SucceededRunIds = [], ArchivedRuns = [], Failed = failed };

        const string updateSql = """
                                 DECLARE @Archived TABLE (
                                     RunId UNIQUEIDENTIFIER NOT NULL,
                                     TenantId UNIQUEIDENTIFIER NOT NULL,
                                     WorkspaceId UNIQUEIDENTIFIER NOT NULL,
                                     ScopeProjectId UNIQUEIDENTIFIER NOT NULL
                                 );

                                 DECLARE @cntGolden INT = 0;
                                 DECLARE @cntFindings INT = 0;
                                 DECLARE @cntContext INT = 0;
                                 DECLARE @cntGraph INT = 0;
                                 DECLARE @cntDecisioning INT = 0;
                                 DECLARE @cntArtifact INT = 0;
                                 DECLARE @cntAgentTrace INT = 0;
                                 DECLARE @cntComparison INT = 0;

                                 UPDATE dbo.Runs
                                 SET ArchivedUtc = SYSUTCDATETIME()
                                 OUTPUT inserted.RunId, inserted.TenantId, inserted.WorkspaceId, inserted.ScopeProjectId
                                 INTO @Archived
                                 WHERE RunId IN @ToArchive AND ArchivedUtc IS NULL;

                                 IF COL_LENGTH(N'dbo.GoldenManifests', N'ArchivedUtc') IS NOT NULL
                                 BEGIN
                                     UPDATE dbo.GoldenManifests
                                     SET ArchivedUtc = SYSUTCDATETIME()
                                     WHERE RunId IN (SELECT RunId FROM @Archived) AND ArchivedUtc IS NULL;
                                     SET @cntGolden = @cntGolden + @@ROWCOUNT;
                                 END;

                                 IF COL_LENGTH(N'dbo.FindingsSnapshots', N'ArchivedUtc') IS NOT NULL
                                 BEGIN
                                     UPDATE dbo.FindingsSnapshots
                                     SET ArchivedUtc = SYSUTCDATETIME()
                                     WHERE RunId IN (SELECT RunId FROM @Archived) AND ArchivedUtc IS NULL;
                                     SET @cntFindings = @cntFindings + @@ROWCOUNT;
                                 END;

                                 IF COL_LENGTH(N'dbo.ContextSnapshots', N'ArchivedUtc') IS NOT NULL
                                 BEGIN
                                     UPDATE dbo.ContextSnapshots
                                     SET ArchivedUtc = SYSUTCDATETIME()
                                     WHERE RunId IN (SELECT RunId FROM @Archived) AND ArchivedUtc IS NULL;
                                     SET @cntContext = @cntContext + @@ROWCOUNT;
                                 END;

                                 IF COL_LENGTH(N'dbo.GraphSnapshots', N'ArchivedUtc') IS NOT NULL
                                 BEGIN
                                     UPDATE dbo.GraphSnapshots
                                     SET ArchivedUtc = SYSUTCDATETIME()
                                     WHERE RunId IN (SELECT RunId FROM @Archived) AND ArchivedUtc IS NULL;
                                     SET @cntGraph = @cntGraph + @@ROWCOUNT;
                                 END;

                                 IF COL_LENGTH(N'dbo.DecisioningTraces', N'ArchivedUtc') IS NOT NULL
                                 BEGIN
                                     UPDATE dbo.DecisioningTraces
                                     SET ArchivedUtc = SYSUTCDATETIME()
                                     WHERE RunId IN (SELECT RunId FROM @Archived) AND ArchivedUtc IS NULL;
                                     SET @cntDecisioning = @cntDecisioning + @@ROWCOUNT;
                                 END;

                                 IF COL_LENGTH(N'dbo.ArtifactBundles', N'ArchivedUtc') IS NOT NULL
                                 BEGIN
                                     UPDATE dbo.ArtifactBundles
                                     SET ArchivedUtc = SYSUTCDATETIME()
                                     WHERE RunId IN (SELECT RunId FROM @Archived) AND ArchivedUtc IS NULL;
                                     SET @cntArtifact = @cntArtifact + @@ROWCOUNT;
                                 END;

                                 IF COL_LENGTH(N'dbo.AgentExecutionTraces', N'ArchivedUtc') IS NOT NULL
                                 BEGIN
                                     UPDATE dbo.AgentExecutionTraces
                                     SET ArchivedUtc = SYSUTCDATETIME()
                                     WHERE ArchivedUtc IS NULL
                                       AND TRY_CAST(RunId AS UNIQUEIDENTIFIER) IN (SELECT RunId FROM @Archived);
                                     SET @cntAgentTrace = @cntAgentTrace + @@ROWCOUNT;
                                 END;

                                 IF COL_LENGTH(N'dbo.ComparisonRecords', N'ArchivedUtc') IS NOT NULL
                                 BEGIN
                                     UPDATE dbo.ComparisonRecords
                                     SET ArchivedUtc = SYSUTCDATETIME()
                                     WHERE ArchivedUtc IS NULL
                                       AND (
                                           TRY_CAST(LeftRunId AS UNIQUEIDENTIFIER) IN (SELECT RunId FROM @Archived)
                                           OR TRY_CAST(RightRunId AS UNIQUEIDENTIFIER) IN (SELECT RunId FROM @Archived));
                                     SET @cntComparison = @cntComparison + @@ROWCOUNT;
                                 END;

                                 SELECT RunId, TenantId, WorkspaceId, ScopeProjectId FROM @Archived;
                                 SELECT
                                     @cntGolden AS GoldenManifests,
                                     @cntFindings AS FindingsSnapshots,
                                     @cntContext AS ContextSnapshots,
                                     @cntGraph AS GraphSnapshots,
                                     @cntDecisioning AS DecisioningTraces,
                                     @cntArtifact AS ArtifactBundles,
                                     @cntAgentTrace AS AgentExecutionTraces,
                                     @cntComparison AS ComparisonRecords;
                                 """;

        await using SqlTransaction tran = (SqlTransaction)await connection.BeginTransactionAsync(ct);

        List<ArchivedRunScopeRow> archived;

        RunArchiveChildCascadeCounts childCascade;

        try
        {
            await using SqlMapper.GridReader multi = await connection.QueryMultipleAsync(
                new CommandDefinition(updateSql, new
                {
                    ToArchive = toArchive
                }, tran, cancellationToken: ct));

            archived = (await multi.ReadAsync<ArchivedRunScopeRow>()).ToList();
            childCascade = (await multi.ReadAsync<RunArchiveChildCascadeCounts>()).Single();

            await tran.CommitAsync(ct);
        }
        catch
        {
            await tran.RollbackAsync(ct);
            throw;
        }

        HashSet<Guid> succeededSet = archived.Select(static r => r.RunId).ToHashSet();

        foreach (Guid id in toArchive)

            if (!succeededSet.Contains(id))

                failed.Add(new RunArchiveByIdFailure(id,
                    "Run could not be archived (concurrent update or missing row)."));

        return new RunArchiveByIdsResult
        {
            SucceededRunIds = archived.Select(static r => r.RunId).ToList(),
            ArchivedRuns = archived,
            Failed = failed,
            ChildCascade = childCascade
        };
    }

    /// <inheritdoc />
    public async Task<int> CountActiveRunsForArchitectureRequestAsync(
        ScopeContext scope,
        string architectureRequestId,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ScopedRepositoryScopeValidation.RequireScopedTenant(scope);

        if (string.IsNullOrWhiteSpace(architectureRequestId))
            throw new ArgumentException("Architecture request id is required.", nameof(architectureRequestId));

        const string sql = """
                           SELECT COUNT(1)
                           FROM dbo.Runs
                           WHERE TenantId = @TenantId
                             AND WorkspaceId = @WorkspaceId
                             AND ScopeProjectId = @ScopeProjectId
                             AND ArchitectureRequestId = @ArchitectureRequestId
                             AND ArchivedUtc IS NULL
                             AND (
                                 LegacyRunStatus IS NULL
                                 OR LegacyRunStatus NOT IN (@CommittedStatus, @FailedStatus, @QualityRejectedStatus));
                           """;

        using IDbConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct);

        int count = await connection.QuerySingleAsync<int>(
            new CommandDefinition(
                sql,
                new
                {
                    scope.TenantId,
                    scope.WorkspaceId,
                    ScopeProjectId = scope.ProjectId,
                    ArchitectureRequestId = architectureRequestId.Trim(),
                    CommittedStatus = nameof(ArchitectureRunStatus.Committed),
                    FailedStatus = nameof(ArchitectureRunStatus.Failed),
                    QualityRejectedStatus = nameof(ArchitectureRunStatus.ExecutionCompletedQualityRejected),
                },
                cancellationToken: ct));

        return count;
    }

    /// <inheritdoc />
    public async Task<RunStaleUncommittedPurgeBatchResult> HardDeleteStaleUncommittedRunsBatchAsync(
        DateTimeOffset createdBeforeUtc,
        int batchSize,
        CancellationToken ct)
    {
        if (batchSize < 1)
            throw new ArgumentOutOfRangeException(nameof(batchSize), batchSize, "Batch size must be at least 1.");

        int safeBatch = Math.Clamp(batchSize, 1, 10_000);

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct);

        IEnumerable<ArchivedRunScopeRow> rows = await connection.QueryAsync<ArchivedRunScopeRow>(
            new CommandDefinition(
                "dbo.Archival_PurgeStaleUncommittedRunsBatch",
                new
                {
                    CutoffUtc = createdBeforeUtc.UtcDateTime,
                    BatchSize = safeBatch
                },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct));

        List<ArchivedRunScopeRow> list = rows.AsList();

        return new RunStaleUncommittedPurgeBatchResult { Deleted = list };
    }

    private static void ValidateRunKeysetCursor(DateTime? cursorCreatedUtc, Guid? cursorRunId)
    {
        if (cursorCreatedUtc.HasValue != cursorRunId.HasValue)
            throw new ArgumentException(
                "Run keyset cursor requires both CreatedUtc and RunId together, or both omitted for the first page.");
    }

    /// <summary>
    ///     Binds <see cref="RunRecord.StructuralExecutionMode" /> as NVARCHAR labels. Dapper may otherwise send the enum's
    ///     underlying integer, which SQL coerces to values like <c>N'0'</c> and fails <c>CK_Runs_StructuralExecutionMode</c>.
    /// </summary>
    private static object CreateRunInsertParameters(RunRecord run)
    {
        ArgumentNullException.ThrowIfNull(run);

        return new
        {
            run.RunId,
            run.TenantId,
            run.WorkspaceId,
            run.ScopeProjectId,
            run.ProjectId,
            run.Description,
            run.CreatedUtc,
            run.ContextSnapshotId,
            run.GraphSnapshotId,
            run.FindingsSnapshotId,
            run.GoldenManifestId,
            run.DecisionTraceId,
            run.ArtifactBundleId,
            run.ArchivedUtc,
            run.ArchitectureRequestId,
            run.LegacyRunStatus,
            run.CompletedUtc,
            run.CurrentManifestVersion,
            run.OtelTraceId,
            run.IsDemoWelcomeRun,
            run.IsPublicShowcase,
            run.IsPinned,
            run.RealModeFellBackToSimulator,
            run.PilotAoaiDeploymentSnapshot,
            StructuralExecutionMode = run.StructuralExecutionMode.ToString(),
            run.RetryCount,
            run.LastFailureReason
        };
    }

    private static async Task ApplyUpdateAsync(
        IDbConnection connection,
        IDbTransaction? transaction,
        RunRecord run,
        string sql,
        CancellationToken ct)
    {
        byte[]? newStamp = await connection.QuerySingleOrDefaultAsync<byte[]>(
            new CommandDefinition(
                sql,
                new
                {
                    run.RunId,
                    run.TenantId,
                    run.WorkspaceId,
                    run.ScopeProjectId,
                    run.ProjectId,
                    run.Description,
                    run.ContextSnapshotId,
                    run.GraphSnapshotId,
                    run.FindingsSnapshotId,
                    run.GoldenManifestId,
                    run.DecisionTraceId,
                    run.ArtifactBundleId,
                    run.ArchivedUtc,
                    run.ArchitectureRequestId,
                    run.LegacyRunStatus,
                    run.CompletedUtc,
                    run.CurrentManifestVersion,
                    run.IsDemoWelcomeRun,
                    run.IsPublicShowcase,
                    run.IsPinned,
                    run.RealModeFellBackToSimulator,
                    run.PilotAoaiDeploymentSnapshot,
                    StructuralExecutionMode = run.StructuralExecutionMode.ToString(),
                    run.RetryCount,
                    run.LastFailureReason,
                    run.RowVersion
                },
                transaction,
                cancellationToken: ct));

        if (newStamp is null)
        {
            if (run.RowVersion is not null)
                throw new RunConcurrencyConflictException(run.RunId);

            throw new InvalidOperationException($"Run '{run.RunId:D}' was not found for update.");
        }

        run.RowVersion = newStamp;
    }
}
