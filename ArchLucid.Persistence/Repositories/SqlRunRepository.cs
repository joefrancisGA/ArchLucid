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

        const string sql = RunRepositorySql.Insert;

        object insertParams = RunRecordParameters.Insert(run);

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
            await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);

            return await connection.QuerySingleOrDefaultAsync<RunRecord>(
                new CommandDefinition(
                    RunRepositorySql.SelectByScopedId,
                    RunRecordParameters.ForRun(scope, runId),
                    cancellationToken: ct)).ConfigureAwait(false);
        }
        finally
        {
            ArchLucidInstrumentation.RecordNamedQueryLatencyMilliseconds(
                NamedQueryTelemetryNames.GetRunByScopedId,
                sw.Elapsed.TotalMilliseconds);
        }
    }

    public async Task<RunRecord?> GetByIdIncludingArchivedAsync(ScopeContext scope, Guid runId, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);
        PersistenceTenantScope.RequireScopedTenant(scope);

        Stopwatch sw = Stopwatch.StartNew();

        try
        {
            await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);

            return await connection.QuerySingleOrDefaultAsync<RunRecord>(
                new CommandDefinition(
                    RunRepositorySql.SelectByScopedIdIncludingArchived,
                    RunRecordParameters.ForRun(scope, runId),
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
            await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);

            return await connection.QuerySingleOrDefaultAsync<RunRecord>(
                new CommandDefinition(RunRepositorySql.SelectByRunIdAdmin, new
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
            await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);

            return await connection.QuerySingleOrDefaultAsync<RunRecord>(
                new CommandDefinition(
                    RunRepositorySql.SelectLatestWithGraphAtOrBefore,
                    RunListQueryParameters.ForLatestGraphAtOrBefore(scope, authorityProjectSlug, asOfUtc),
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

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);

        return await connection.QuerySingleOrDefaultAsync<Guid?>(
            new CommandDefinition(
                RunRepositorySql.SelectLatestCommittedRunIdByManifestCreatedUtc,
                RunListQueryParameters.ForLatestCommittedByManifestCreatedUtc(scope, projectId),
                cancellationToken: ct)).ConfigureAwait(false);
    }

    /// <inheritdoc />
    public async Task<Guid?> GetPriorCommittedRunIdBeforeCurrentAsync(
        ScopeContext scope,
        string projectId,
        Guid currentRunId,
        DateTime currentCreatedUtc,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(projectId);
        PersistenceTenantScope.RequireScopedTenant(scope);

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);

        return await connection.QuerySingleOrDefaultAsync<Guid?>(
            new CommandDefinition(
                RunRepositorySql.SelectPriorCommittedRunIdBeforeCurrent,
                RunListQueryParameters.ForPriorCommittedRunBeforeCurrent(
                    scope,
                    projectId,
                    currentRunId,
                    currentCreatedUtc),
                cancellationToken: ct)).ConfigureAwait(false);
    }

    public async Task<Guid?> GetPriorCommittedRunIdForArchitectureBeforeCurrentAsync(
        ScopeContext scope,
        Guid architectureId,
        Guid currentRunId,
        DateTime currentCreatedUtc,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);
        PersistenceTenantScope.RequireScopedTenant(scope);

        if (architectureId == Guid.Empty)
            return null;

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);

        return await connection.QuerySingleOrDefaultAsync<Guid?>(
            new CommandDefinition(
                RunRepositorySql.SelectPriorCommittedRunIdForArchitectureBeforeCurrent,
                RunListQueryParameters.ForPriorCommittedRunForArchitectureBeforeCurrent(
                    scope,
                    architectureId,
                    currentRunId,
                    currentCreatedUtc),
                cancellationToken: ct)).ConfigureAwait(false);
    }

    public async Task<Guid?> GetCommittedRunIdByGoldenManifestIdAsync(
        ScopeContext scope,
        Guid architectureId,
        Guid goldenManifestId,
        Guid excludeRunId,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);
        PersistenceTenantScope.RequireScopedTenant(scope);

        if (architectureId == Guid.Empty || goldenManifestId == Guid.Empty)
            return null;

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);

        return await connection.QuerySingleOrDefaultAsync<Guid?>(
            new CommandDefinition(
                RunRepositorySql.SelectCommittedRunIdByGoldenManifestId,
                RunListQueryParameters.ForCommittedRunByGoldenManifestId(
                    scope,
                    architectureId,
                    goldenManifestId,
                    excludeRunId),
                cancellationToken: ct)).ConfigureAwait(false);
    }

    public async Task ClearGraphSnapshotForArchitectureAsync(
        ScopeContext scope,
        Guid architectureId,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);
        PersistenceTenantScope.RequireScopedTenant(scope);

        if (architectureId == Guid.Empty)
            return;

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);

        await connection.ExecuteAsync(
            new CommandDefinition(
                RunRepositorySql.ClearGraphSnapshotForArchitecture,
                RunListQueryParameters.ForClearGraphSnapshotForArchitecture(scope, architectureId),
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
                    RunListQueryParameters.ForProjectList(scope, projectId, take),
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

        // NOLOCK: same dashboard-grade tolerance as unpaged lists.

        Stopwatch sw = Stopwatch.StartNew();

        try
        {
            await using SqlConnection connection = await authorityRunListConnectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);
            IEnumerable<RunRecord> rows = await connection.QueryAsync<RunRecord>(
                new CommandDefinition(
                    HotPathRelationalQueryShapes.RunsListByProjectKeysetNoLock,
                    RunListQueryParameters.ForProjectKeysetPage(scope, projectId, cursorCreatedUtc, cursorRunId, take),
                    cancellationToken: ct)).ConfigureAwait(false);

            return RunListPageAssembler.FromProbedRows(rows, RunPagination.ClampTake(take));
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
                    RunListQueryParameters.ForRecentInScope(scope, take),
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

        // NOLOCK: keyset continuation for picker/dashboard lists (same tolerance as ListRecentInScopeAsync).

        Stopwatch sw = Stopwatch.StartNew();

        try
        {
            await using SqlConnection connection = await authorityRunListConnectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);
            IEnumerable<RunRecord> rows = await connection.QueryAsync<RunRecord>(
                new CommandDefinition(
                    HotPathRelationalQueryShapes.RunsListRecentInScopeKeysetNoLock,
                    RunListQueryParameters.ForRecentInScopeKeysetPage(scope, cursorCreatedUtc, cursorRunId, take),
                    cancellationToken: ct)).ConfigureAwait(false);

            return RunListPageAssembler.FromProbedRows(rows, RunPagination.ClampTake(take));
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

        Stopwatch sw = Stopwatch.StartNew();

        try
        {
            await using SqlConnection connection = await authorityRunListConnectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);
            IEnumerable<RunRecord> rows = await connection.QueryAsync<RunRecord>(
                new CommandDefinition(
                    HotPathRelationalQueryShapes.RunsListRecentInScopeOffsetNoLock,
                    RunListQueryParameters.ForRecentInScopeOffsetPage(scope, offset, limit),
                    cancellationToken: ct)).ConfigureAwait(false);

            return RunListPageAssembler.FromProbedRows(rows, RunPagination.ClampLimit(limit));
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

        const string sql = RunRepositorySql.Update;

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
        CancellationToken ct) =>
        await ArchiveRunsCreatedBeforeCoreAsync(RunRepositorySql.ArchiveRunsCreatedBefore, new { Cutoff = cutoffUtc.UtcDateTime }, ct)
            .ConfigureAwait(false);

    /// <inheritdoc />
    public async Task<RunArchiveBatchResult> ArchiveRunsCreatedBeforeForScopeAsync(
        ScopeContext scope,
        DateTimeOffset cutoffUtc,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);
        PersistenceTenantScope.RequireScopedTenant(scope);

        return await ArchiveRunsCreatedBeforeCoreAsync(
            RunRepositorySql.ArchiveRunsCreatedBeforeInScope,
            new
            {
                Cutoff = cutoffUtc.UtcDateTime,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ScopeProjectId = scope.ProjectId
            },
            ct).ConfigureAwait(false);
    }

    private async Task<RunArchiveBatchResult> ArchiveRunsCreatedBeforeCoreAsync(
        string sql,
        object parameters,
        CancellationToken ct)
    {
        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);
        await using SqlTransaction tran = (SqlTransaction)await connection.BeginTransactionAsync(ct).ConfigureAwait(false);

        try
        {
            await using SqlMapper.GridReader multi = await connection.QueryMultipleAsync(
                new CommandDefinition(sql, parameters, tran, cancellationToken: ct)).ConfigureAwait(false);

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

        List<Guid> distinctOrdered = RunArchiveByIdsOutcome.DistinctInRequestOrder(runIds);

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);
        await using SqlTransaction tran = (SqlTransaction)await connection.BeginTransactionAsync(ct).ConfigureAwait(false);

        List<ArchivedRunScopeRow> archived;
        List<Guid> alreadyArchivedRunIds;
        RunArchiveChildCascadeCounts childCascade;

        try
        {
            await using SqlMapper.GridReader multi = await connection.QueryMultipleAsync(
                new CommandDefinition(RunRepositorySql.ArchiveRunsByIds, new
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

        return RunArchiveByIdsOutcome.Assemble(distinctOrdered, archived, alreadyArchivedRunIds, childCascade);
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

        using IDbConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);

        return await connection.QuerySingleAsync<int>(
            new CommandDefinition(
                RunRepositorySql.CountActiveRunsForArchitectureRequest,
                RunListQueryParameters.ForActiveRunCountByArchitectureRequest(scope, architectureRequestId),
                cancellationToken: ct)).ConfigureAwait(false);
    }

    /// <inheritdoc />
    public async Task<bool> ExistsRunForArchitectureRequestInScopeAsync(
        ScopeContext scope,
        string architectureRequestId,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);
        PersistenceTenantScope.RequireScopedTenant(scope);

        if (string.IsNullOrWhiteSpace(architectureRequestId))
            throw new ArgumentException("Architecture request id is required.", nameof(architectureRequestId));

        using IDbConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);

        int exists = await connection.QuerySingleAsync<int>(
            new CommandDefinition(
                RunRepositorySql.ExistsRunForArchitectureRequestInScope,
                RunListQueryParameters.ForArchitectureRequestScopeExists(scope, architectureRequestId),
                cancellationToken: ct)).ConfigureAwait(false);

        return exists == 1;
    }

    /// <inheritdoc />
    public async Task<bool> ExistsActiveRunWithSystemNameInWorkspaceAsync(
        ScopeContext scope,
        string systemName,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);
        PersistenceTenantScope.RequireScopedTenant(scope);

        if (string.IsNullOrWhiteSpace(systemName))
            throw new ArgumentException("System name is required.", nameof(systemName));

        using IDbConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);

        int exists = await connection.QuerySingleAsync<int>(
            new CommandDefinition(
                RunRepositorySql.ExistsActiveRunWithSystemNameInWorkspace,
                RunListQueryParameters.ForActiveRunWithSystemNameInWorkspace(scope, systemName),
                cancellationToken: ct)).ConfigureAwait(false);

        return exists == 1;
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

        return await connection.QuerySingleOrDefaultAsync<RunRecord>(
            new CommandDefinition(
                RunRepositorySql.SelectAnchorGuardByScopedId,
                RunRecordParameters.AnchorGuardKey(run),
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
                    RunRecordParameters.Update(run),
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

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct).ConfigureAwait(false);

        int rows = await connection.ExecuteAsync(
            new CommandDefinition(
                RunRepositorySql.UpdateOperatorGovernanceDisposition,
                RunRecordParameters.ForOperatorGovernanceDisposition(
                    scope,
                    runId,
                    decision,
                    rationale,
                    actorUserId,
                    occurredUtc),
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
