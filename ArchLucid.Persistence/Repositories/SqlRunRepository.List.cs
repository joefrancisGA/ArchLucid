using System.Diagnostics;

using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Pagination;
using ArchLucid.Core.Persistence;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Data.Infrastructure;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Sql;
using ArchLucid.Persistence.Telemetry;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Repositories;

public sealed partial class SqlRunRepository
{

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
        RunRepositoryCore.ValidateRunKeysetCursor(cursorCreatedUtc, cursorRunId);
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
        RunRepositoryCore.ValidateRunKeysetCursor(cursorCreatedUtc, cursorRunId);
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
}
