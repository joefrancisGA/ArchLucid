using System.Data;
using System.Diagnostics;
using System.Diagnostics.CodeAnalysis;

using ArchLucid.Contracts.Common;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Pagination;
using ArchLucid.Core.Persistence;
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
        PersistenceTenantScope.RequireEntityTenant(run.TenantId);

        const string sql = """
                           DECLARE @RunInsertOutput TABLE (RowVersionStamp VARBINARY(8) NOT NULL);

                           INSERT INTO dbo.Runs
                           (
                               RunId, TenantId, WorkspaceId, ScopeProjectId, ProjectId, Description, CreatedUtc,
                               ContextSnapshotId, GraphSnapshotId, FindingsSnapshotId,
                               GoldenManifestId, DecisionTraceId, ArtifactBundleId, ArchivedUtc,
                               ArchitectureRequestId, LegacyRunStatus, CompletedUtc, CurrentManifestVersion, OtelTraceId,
                               IsDemoWelcomeRun, IsPublicShowcase, IsSample, IsPinned, RealModeFellBackToSimulator, PilotAoaiDeploymentSnapshot,
                               StructuralExecutionMode,
                               RetryCount, LastFailureReason, PackageOrigin
                           )
                           OUTPUT inserted.RowVersionStamp INTO @RunInsertOutput
                           VALUES
                           (
                               @RunId, @TenantId, @WorkspaceId, @ScopeProjectId, @ProjectId, @Description, @CreatedUtc,
                               @ContextSnapshotId, @GraphSnapshotId, @FindingsSnapshotId,
                               @GoldenManifestId, @DecisionTraceId, @ArtifactBundleId, @ArchivedUtc,
                               @ArchitectureRequestId, @LegacyRunStatus, @CompletedUtc, @CurrentManifestVersion, @OtelTraceId,
                               @IsDemoWelcomeRun, @IsPublicShowcase, @IsSample, @IsPinned, @RealModeFellBackToSimulator, @PilotAoaiDeploymentSnapshot,
                               @StructuralExecutionMode,
                               @RetryCount, @LastFailureReason, @PackageOrigin
                           );

                           SELECT RowVersionStamp FROM @RunInsertOutput;
                           """;

        object insertParams = CreateRunInsertParameters(run);

        if (connection is not null)
        {
            if (ShouldConsumeTrialRunAllowance(run))
                await _tenantRepository.TryIncrementActiveTrialRunAsync(run.TenantId, ct, connection, transaction).ConfigureAwait(false);

            byte[] stamp = await connection.QuerySingleAsync<byte[]>(
                new CommandDefinition(sql, insertParams, transaction, cancellationToken: ct)).ConfigureAwait(false);
            run.RowVersion = stamp;

            return;
        }

        await using SqlConnection owned = await connectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);
        await using SqlTransaction tran = (SqlTransaction)await owned.BeginTransactionAsync(ct).ConfigureAwait(false);

        try
        {
            if (ShouldConsumeTrialRunAllowance(run))
                await _tenantRepository.TryIncrementActiveTrialRunAsync(run.TenantId, ct, owned, tran).ConfigureAwait(false);

            byte[] ownedStamp =
                await owned.QuerySingleAsync<byte[]>(new CommandDefinition(sql, insertParams, tran, cancellationToken: ct)).ConfigureAwait(false);
            run.RowVersion = ownedStamp;
            await tran.CommitAsync(ct).ConfigureAwait(false);
        }
        catch
        {
            await tran.RollbackAsync(ct).ConfigureAwait(false);
            throw;
        }
    }

    public async Task<RunRecord?> GetByIdAsync(ScopeContext scope, Guid runId, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);
        PersistenceTenantScope.RequireScopedTenant(scope);

        Stopwatch sw = Stopwatch.StartNew();

        try
        {
            const string sql = """
                               SELECT
                                   RunId, TenantId, WorkspaceId, ScopeProjectId, ProjectId, Description, CreatedUtc,
                                   ContextSnapshotId, GraphSnapshotId, FindingsSnapshotId,
                                   GoldenManifestId, DecisionTraceId, ArtifactBundleId, ArchivedUtc,
                                   ArchitectureRequestId, LegacyRunStatus, CompletedUtc, CurrentManifestVersion, OtelTraceId,
                                   IsDemoWelcomeRun, IsPublicShowcase, IsSample, IsPinned, RealModeFellBackToSimulator, PilotAoaiDeploymentSnapshot,
                                   StructuralExecutionMode,
                                   RetryCount, LastFailureReason, EngineProvenanceJson, PackageOrigin,
                                   OperatorGovernanceDecision, OperatorGovernanceDecisionRationale,
                                   OperatorGovernanceDecisionUtc, OperatorGovernanceDecisionByUserId,
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

            await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);

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
                    cancellationToken: ct)).ConfigureAwait(false);
        }
        finally
        {
            ArchLucidInstrumentation.RecordNamedQueryLatencyMilliseconds(
                NamedQueryTelemetryNames.GetRunByScopedId,
                sw.Elapsed.TotalMilliseconds);
        }
    }

    [TenantScopeExempt(TenantScopeExemptReason.Operational, "Admin run lookup by id within the active tenant catalog.")]
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
                                   IsDemoWelcomeRun, IsPublicShowcase, IsSample, IsPinned, RealModeFellBackToSimulator, PilotAoaiDeploymentSnapshot,
                                   StructuralExecutionMode,
                                   RetryCount, LastFailureReason, EngineProvenanceJson,
                                   RowVersionStamp AS RowVersion,
                                   CASE WHEN EXISTS (SELECT 1 FROM dbo.FindingsSnapshots fs WITH (NOLOCK) WHERE fs.RunId = dbo.Runs.RunId AND fs.ArchivedUtc IS NULL AND fs.HasWarnings = 1) THEN 1 ELSE 0 END AS HasWarnings,
                                   CASE WHEN EXISTS (SELECT 1 FROM dbo.AlertRecords ar WITH (NOLOCK) WHERE ar.RunId = dbo.Runs.RunId AND ar.Status = 'Open') THEN 1 ELSE 0 END AS HasGovernanceWarnings
                               FROM dbo.Runs
                               WHERE RunId = @RunId
                                 AND ArchivedUtc IS NULL;
                               """;

            await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);

            return await connection.QuerySingleOrDefaultAsync<RunRecord>(
                new CommandDefinition(sql, new
                {
                    RunId = runId
                }, cancellationToken: ct)).ConfigureAwait(false);
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
        PersistenceTenantScope.RequireScopedTenant(scope);

        Stopwatch sw = Stopwatch.StartNew();

        try
        {
            const string sql = """
                               SELECT TOP (1)
                                   RunId, TenantId, WorkspaceId, ScopeProjectId, ProjectId, Description, CreatedUtc,
                                   ContextSnapshotId, GraphSnapshotId, FindingsSnapshotId,
                                   GoldenManifestId, DecisionTraceId, ArtifactBundleId, ArchivedUtc,
                                   ArchitectureRequestId, LegacyRunStatus, CompletedUtc, CurrentManifestVersion, OtelTraceId,
                                   IsDemoWelcomeRun, IsPublicShowcase, IsSample, IsPinned, RealModeFellBackToSimulator, PilotAoaiDeploymentSnapshot,
                                   StructuralExecutionMode,
                                   RetryCount, LastFailureReason, EngineProvenanceJson,
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

            await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);

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
                    cancellationToken: ct)).ConfigureAwait(false);
        }
        finally
        {
            ArchLucidInstrumentation.RecordNamedQueryLatencyMilliseconds(
                NamedQueryTelemetryNames.GetLatestRunWithGraphAtOrBefore,
                sw.Elapsed.TotalMilliseconds);
        }
    }

    /// <inheritdoc />
    public async Task<Guid?> GetLatestCommittedRunIdByManifestCreatedUtcAsync(
        ScopeContext scope,
        string projectId,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(projectId);
        PersistenceTenantScope.RequireScopedTenant(scope);

        const string sql = """
                           SELECT TOP (1) r.RunId
                           FROM dbo.Runs r WITH (NOLOCK)
                           INNER JOIN dbo.GoldenManifests gm WITH (NOLOCK)
                               ON gm.ManifestId = r.GoldenManifestId
                           WHERE r.TenantId = @TenantId
                             AND r.WorkspaceId = @WorkspaceId
                             AND r.ScopeProjectId = @ScopeProjectId
                             AND r.ProjectId = @AuthorityProjectSlug
                             AND r.ArchivedUtc IS NULL
                             AND gm.ArchivedUtc IS NULL
                             AND (
                                  r.LegacyRunStatus = @CommittedStatus
                                  OR NULLIF(LTRIM(RTRIM(r.CurrentManifestVersion)), N'') IS NOT NULL
                                  OR r.GoldenManifestId IS NOT NULL
                             )
                           ORDER BY gm.CreatedUtc DESC, r.RunId DESC;
                           """;

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);

        return await connection.QuerySingleOrDefaultAsync<Guid?>(
            new CommandDefinition(
                sql,
                new
                {
                    scope.TenantId,
                    scope.WorkspaceId,
                    ScopeProjectId = scope.ProjectId,
                    AuthorityProjectSlug = projectId,
                    CommittedStatus = nameof(ArchitectureRunStatus.Committed)
                },
                cancellationToken: ct)).ConfigureAwait(false);
    }

    public async Task<IReadOnlyList<RunRecord>> ListByProjectAsync(
        ScopeContext scope,
        string projectId,
        int take,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);
        PersistenceTenantScope.RequireScopedTenant(scope);

        // NOLOCK: dashboard-grade list on hot-write table; tolerates replica-style staleness (see ListRecentInScopeAsync).

        Stopwatch sw = Stopwatch.StartNew();

        try
        {
            await using SqlConnection connection = await authorityRunListConnectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);
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
                    cancellationToken: ct)).ConfigureAwait(false);

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
        PersistenceTenantScope.RequireScopedTenant(scope);

        int safeTake = RunPagination.ClampTake(take);
        int fetch = safeTake + 1;

        // NOLOCK: same dashboard-grade tolerance as unpaged lists.

        Stopwatch sw = Stopwatch.StartNew();

        try
        {
            await using SqlConnection connection = await authorityRunListConnectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);
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
                    cancellationToken: ct)).ConfigureAwait(false);

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
        PersistenceTenantScope.RequireScopedTenant(scope);

        Stopwatch sw = Stopwatch.StartNew();

        try
        {
            // NOLOCK: dashboard / picker list; same tolerance as read-replica staleness (see LOAD_TEST_BASELINE.md). Avoids S-lock blocking behind writers on dbo.Runs.

            await using SqlConnection connection = await authorityRunListConnectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);
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
                    cancellationToken: ct)).ConfigureAwait(false);

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
        PersistenceTenantScope.RequireScopedTenant(scope);

        int safeTake = RunPagination.ClampTake(take);
        int fetch = safeTake + 1;

        // NOLOCK: keyset continuation for picker/dashboard lists (same tolerance as ListRecentInScopeAsync).

        Stopwatch sw = Stopwatch.StartNew();

        try
        {
            await using SqlConnection connection = await authorityRunListConnectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);
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
                    cancellationToken: ct)).ConfigureAwait(false);

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
        PersistenceTenantScope.RequireScopedTenant(scope);

        int safeLimit = RunPagination.ClampLimit(limit);
        int safeOffset = RunPagination.NormalizeOffset(offset);
        int fetch = safeLimit + 1;

        Stopwatch sw = Stopwatch.StartNew();

        try
        {
            await using SqlConnection connection = await authorityRunListConnectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);
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
                    cancellationToken: ct)).ConfigureAwait(false);

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
        PersistenceTenantScope.RequireEntityTenant(run.TenantId);

        const string sql = """
                           DECLARE @RunUpdateOutput TABLE (RowVersionStamp VARBINARY(8) NOT NULL);

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
                               IsSample = @IsSample,
                               IsPinned = @IsPinned,
                               RealModeFellBackToSimulator = @RealModeFellBackToSimulator,
                               PilotAoaiDeploymentSnapshot = @PilotAoaiDeploymentSnapshot,
                               StructuralExecutionMode = @StructuralExecutionMode,
                               RetryCount = @RetryCount,
                               LastFailureReason = @LastFailureReason,
                               EngineProvenanceJson = @EngineProvenanceJson,
                               PackageOrigin = @PackageOrigin
                           OUTPUT inserted.RowVersionStamp INTO @RunUpdateOutput
                           WHERE RunId = @RunId
                             AND TenantId = @TenantId
                             AND WorkspaceId = @WorkspaceId
                             AND ScopeProjectId = @ScopeProjectId
                             AND (@RowVersion IS NULL OR RowVersionStamp = @RowVersion);

                           SELECT RowVersionStamp FROM @RunUpdateOutput;
                           """;

        if (connection is not null)
        {
            await EnsureCommittedRunHeaderAnchorsUnchangedAsync(connection, transaction, run, ct).ConfigureAwait(false);
            await ApplyUpdateAsync(connection, transaction, run, sql, ct).ConfigureAwait(false);

            return;
        }

        await using SqlConnection owned = await connectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);
        await EnsureCommittedRunHeaderAnchorsUnchangedAsync(owned, null, run, ct).ConfigureAwait(false);
        await ApplyUpdateAsync(owned, null, run, sql, ct).ConfigureAwait(false);
    }

    /// <inheritdoc />
    [TenantScopeExempt(TenantScopeExemptReason.Operational, "Tenant-catalog retention archival; updates runs by CreatedUtc cutoff within the active catalog.")]
    public async Task<RunArchiveBatchResult> ArchiveRunsCreatedBeforeAsync(DateTimeOffset cutoffUtc,
        CancellationToken ct)
    {
        const string sql = """
                           DECLARE @ArchivedScratch TABLE (
                               RunId UNIQUEIDENTIFIER NOT NULL,
                               TenantId UNIQUEIDENTIFIER NOT NULL,
                               WorkspaceId UNIQUEIDENTIFIER NOT NULL,
                               ScopeProjectId UNIQUEIDENTIFIER NOT NULL
                           );

                           DECLARE @Archived dbo.ArchivedRunIdList;

                           UPDATE dbo.Runs
                           SET ArchivedUtc = SYSUTCDATETIME()
                           OUTPUT inserted.RunId, inserted.TenantId, inserted.WorkspaceId, inserted.ScopeProjectId
                           INTO @ArchivedScratch
                           WHERE ArchivedUtc IS NULL AND CreatedUtc < @Cutoff;

                           INSERT INTO @Archived (RunId)
                           SELECT RunId FROM @ArchivedScratch;

                           SELECT RunId, TenantId, WorkspaceId, ScopeProjectId FROM @ArchivedScratch;

                           EXEC dbo.Archival_CascadeFromArchivedRuns @Archived = @Archived;
                           """;

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);
        await using SqlTransaction tran = (SqlTransaction)await connection.BeginTransactionAsync(ct).ConfigureAwait(false);

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
                    cancellationToken: ct)).ConfigureAwait(false);

            List<ArchivedRunScopeRow> rows = (await multi.ReadAsync<ArchivedRunScopeRow>().ConfigureAwait(false)).ToList();
            RunArchiveChildCascadeCounts childCascade = (await multi.ReadAsync<RunArchiveChildCascadeCounts>().ConfigureAwait(false)).Single();

            await tran.CommitAsync(ct).ConfigureAwait(false);

            return new RunArchiveBatchResult { UpdatedCount = rows.Count, ArchivedRuns = rows, ChildCascade = childCascade };
        }
        catch
        {
            await tran.RollbackAsync(ct).ConfigureAwait(false);
            throw;
        }
    }

    /// <inheritdoc />
    [TenantScopeExempt(TenantScopeExemptReason.Operational, "Tenant-catalog retention archival; archives explicit run ids within the active catalog.")]
    public async Task<RunArchiveByIdsResult> ArchiveRunsByIdsAsync(IReadOnlyList<Guid> runIds, CancellationToken ct)
    {
        if (runIds.Count == 0)
            return new RunArchiveByIdsResult();

        List<Guid> distinctOrdered = [];
        HashSet<Guid> seen = [];

        distinctOrdered.AddRange(runIds.Where(seen.Add));

        const string batchSql = """
                                DECLARE @ArchivedScratch TABLE (
                                    RunId UNIQUEIDENTIFIER NOT NULL,
                                    TenantId UNIQUEIDENTIFIER NOT NULL,
                                    WorkspaceId UNIQUEIDENTIFIER NOT NULL,
                                    ScopeProjectId UNIQUEIDENTIFIER NOT NULL
                                );

                                DECLARE @Archived dbo.ArchivedRunIdList;

                                UPDATE dbo.Runs
                                SET ArchivedUtc = SYSUTCDATETIME()
                                OUTPUT inserted.RunId, inserted.TenantId, inserted.WorkspaceId, inserted.ScopeProjectId
                                INTO @ArchivedScratch
                                WHERE RunId IN @RunIds AND ArchivedUtc IS NULL;

                                INSERT INTO @Archived (RunId)
                                SELECT RunId FROM @ArchivedScratch;

                                SELECT RunId, TenantId, WorkspaceId, ScopeProjectId FROM @ArchivedScratch;

                                SELECT RunId
                                FROM dbo.Runs
                                WHERE RunId IN @RunIds AND ArchivedUtc IS NOT NULL;

                                EXEC dbo.Archival_CascadeFromArchivedRuns @Archived = @Archived;
                                """;

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);
        await using SqlTransaction tran = (SqlTransaction)await connection.BeginTransactionAsync(ct).ConfigureAwait(false);

        List<ArchivedRunScopeRow> archived;
        List<Guid> alreadyArchivedRunIds;
        RunArchiveChildCascadeCounts childCascade;
        List<RunArchiveByIdFailure> failed = [];

        try
        {
            await using SqlMapper.GridReader multi = await connection.QueryMultipleAsync(
                new CommandDefinition(batchSql, new
                {
                    RunIds = distinctOrdered
                }, tran, cancellationToken: ct)).ConfigureAwait(false);

            archived = (await multi.ReadAsync<ArchivedRunScopeRow>().ConfigureAwait(false)).ToList();
            alreadyArchivedRunIds = (await multi.ReadAsync<Guid>().ConfigureAwait(false)).ToList();
            childCascade = (await multi.ReadAsync<RunArchiveChildCascadeCounts>().ConfigureAwait(false)).Single();

            await tran.CommitAsync(ct).ConfigureAwait(false);
        }
        catch
        {
            await tran.RollbackAsync(ct).ConfigureAwait(false);
            throw;
        }

        HashSet<Guid> newlyArchivedSet = archived.Select(static r => r.RunId).ToHashSet();
        HashSet<Guid> alreadyArchivedSet = alreadyArchivedRunIds.ToHashSet();

        foreach (Guid id in distinctOrdered)
        {
            if (newlyArchivedSet.Contains(id))
                continue;

            if (alreadyArchivedSet.Contains(id))
            {
                failed.Add(new RunArchiveByIdFailure(id, "Run already archived."));
                continue;
            }

            failed.Add(new RunArchiveByIdFailure(id, "Run not found."));
        }

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
        PersistenceTenantScope.RequireScopedTenant(scope);

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

        using IDbConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);

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
                cancellationToken: ct)).ConfigureAwait(false);

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

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);

        IEnumerable<ArchivedRunScopeRow> rows = await connection.QueryAsync<ArchivedRunScopeRow>(
            new CommandDefinition(
                "dbo.Archival_PurgeStaleUncommittedRunsBatch",
                new
                {
                    CutoffUtc = createdBeforeUtc.UtcDateTime,
                    BatchSize = safeBatch
                },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct)).ConfigureAwait(false);

        List<ArchivedRunScopeRow> list = rows.AsList();

        return new RunStaleUncommittedPurgeBatchResult { Deleted = list };
    }

    /// <inheritdoc />
    public async Task<RunSamplePurgeBatchResult> HardDeleteSampleRunsBatchAsync(
        Guid? tenantId,
        DateTimeOffset? createdBeforeUtc,
        int batchSize,
        CancellationToken ct)
    {
        if (batchSize < 1)
            throw new ArgumentOutOfRangeException(nameof(batchSize), batchSize, "Batch size must be at least 1.");

        int safeBatch = Math.Clamp(batchSize, 1, 10_000);

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);

        IEnumerable<ArchivedRunScopeRow> rows = await connection.QueryAsync<ArchivedRunScopeRow>(
            new CommandDefinition(
                "dbo.SampleRunPurgeBatch",
                new
                {
                    TenantId = tenantId,
                    CreatedBeforeUtc = createdBeforeUtc?.UtcDateTime,
                    BatchSize = safeBatch
                },
                commandType: CommandType.StoredProcedure,
                cancellationToken: ct)).ConfigureAwait(false);

        List<ArchivedRunScopeRow> list = rows.AsList();

        return new RunSamplePurgeBatchResult { Deleted = list };
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
            run.IsSample,
            run.IsPinned,
            run.RealModeFellBackToSimulator,
            run.PilotAoaiDeploymentSnapshot,
            StructuralExecutionMode = run.StructuralExecutionMode.ToString(),
            run.RetryCount,
            run.LastFailureReason,
            run.EngineProvenanceJson,
            run.PackageOrigin
        };
    }

    private static async Task EnsureCommittedRunHeaderAnchorsUnchangedAsync(
        IDbConnection connection,
        IDbTransaction? transaction,
        RunRecord run,
        CancellationToken ct)
    {
        RunRecord? persisted = await LoadRunForAnchorGuardAsync(connection, transaction, run, ct).ConfigureAwait(false);
        CommittedRunHeaderAnchorGuard.EnsureAnchorsUnchangedIfCommitted(persisted, run);
    }

    private static async Task<RunRecord?> LoadRunForAnchorGuardAsync(
        IDbConnection connection,
        IDbTransaction? transaction,
        RunRecord run,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(connection);

        const string sql = """
                           SELECT
                               RunId, TenantId, WorkspaceId, ScopeProjectId, ProjectId, CreatedUtc,
                               ContextSnapshotId, GraphSnapshotId, FindingsSnapshotId,
                               GoldenManifestId, DecisionTraceId, ArtifactBundleId,
                               CurrentManifestVersion, OtelTraceId, StructuralExecutionMode,
                               EngineProvenanceJson
                           FROM dbo.Runs
                           WHERE RunId = @RunId
                             AND TenantId = @TenantId
                             AND WorkspaceId = @WorkspaceId
                             AND ScopeProjectId = @ScopeProjectId;
                           """;

        return await connection.QuerySingleOrDefaultAsync<RunRecord>(
            new CommandDefinition(
                sql,
                new
                {
                    run.RunId,
                    run.TenantId,
                    run.WorkspaceId,
                    run.ScopeProjectId
                },
                transaction,
                cancellationToken: ct)).ConfigureAwait(false);
    }

    private static async Task ApplyUpdateAsync(
        IDbConnection connection,
        IDbTransaction? transaction,
        RunRecord run,
        string sql,
        CancellationToken ct)
    {
        byte[]? newStamp;

        try
        {
            newStamp = await connection.QuerySingleOrDefaultAsync<byte[]>(
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
                        run.IsSample,
                        run.IsPinned,
                        run.RealModeFellBackToSimulator,
                        run.PilotAoaiDeploymentSnapshot,
                        StructuralExecutionMode = run.StructuralExecutionMode.ToString(),
                        run.RetryCount,
                        run.LastFailureReason,
                        run.EngineProvenanceJson,
                        run.PackageOrigin,
                        run.RowVersion
                    },
                    transaction,
                    cancellationToken: ct)).ConfigureAwait(false);
        }
        catch (SqlException ex) when (ex.Number == CommittedRunHeaderAnchorRegistry.TriggerErrorNumber)
        {
            throw new RunEvidenceAnchorImmutableException(run.RunId);
        }

        if (newStamp is null)
        {
            if (run.RowVersion is not null)
                throw new RunConcurrencyConflictException(run.RunId);

            throw new InvalidOperationException($"Run '{run.RunId:D}' was not found for update.");
        }

        run.RowVersion = newStamp;
    }

    /// <inheritdoc />
    public async Task<bool> TrySetOperatorGovernanceDispositionAsync(
        ScopeContext scope,
        Guid runId,
        string decision,
        string? rationale,
        string actorUserId,
        DateTime occurredUtc,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);
        PersistenceTenantScope.RequireScopedTenant(scope);

        if (runId == Guid.Empty)
            throw new ArgumentException("Run id is required.", nameof(runId));

        if (string.IsNullOrWhiteSpace(decision))
            throw new ArgumentException("Decision is required.", nameof(decision));

        if (string.IsNullOrWhiteSpace(actorUserId))
            throw new ArgumentException("Actor user id is required.", nameof(actorUserId));

        const string sql = """
                           UPDATE dbo.Runs
                           SET OperatorGovernanceDecision = @Decision,
                               OperatorGovernanceDecisionRationale = @Rationale,
                               OperatorGovernanceDecisionUtc = @OccurredUtc,
                               OperatorGovernanceDecisionByUserId = @ActorUserId
                           WHERE RunId = @RunId
                             AND TenantId = @TenantId
                             AND WorkspaceId = @WorkspaceId
                             AND ScopeProjectId = @ScopeProjectId
                             AND ArchivedUtc IS NULL;
                           """;

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);

        int rows = await connection.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    RunId = runId,
                    scope.TenantId,
                    scope.WorkspaceId,
                    ScopeProjectId = scope.ProjectId,
                    Decision = decision.Trim(),
                    Rationale = rationale,
                    OccurredUtc = occurredUtc,
                    ActorUserId = actorUserId.Trim(),
                },
                cancellationToken: ct)).ConfigureAwait(false);

        return rows > 0;
    }

    private static bool ShouldConsumeTrialRunAllowance(RunRecord run)
    {
        return TrialRunQuota.ShouldConsumeAllowanceOnCreate(
            run.IsSample,
            run.IsDemoWelcomeRun,
            run.ArchitectureRequestId);
    }
}
