using System.Data;
using System.Diagnostics;
using System.Diagnostics.CodeAnalysis;

using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Data.Infrastructure;
using ArchLucid.Persistence.Findings;
using ArchLucid.Persistence.RelationalRead;
using ArchLucid.Persistence.Sql;
using ArchLucid.Persistence.Telemetry;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Repositories;

/// <summary>
///     SQL Server-backed <see cref="IFindingsSnapshotRepository" /> with dual-write to <c>FindingsJson</c> and relational
///     finding tables; reads prefer <c>dbo.FindingRecords</c> and fall back to <c>FindingsJson</c> when no rows exist.
///     Typed <see cref="Finding.Payload" /> is stored only in <c>FindingRecords.PayloadJson</c> (sidecar). All other
///     finding
///     fields and trace lists are relational with stable <c>SortOrder</c>. <see cref="FindingsSnapshotMigrator" /> runs on
///     save and after load so schema versioning stays consistent.
/// </summary>
[ExcludeFromCodeCoverage(Justification = "SQL-dependent repository; requires live SQL Server for integration testing.")]
public sealed class SqlFindingsSnapshotRepository(
    ISqlConnectionFactory writeConnectionFactory,
    IReadOnlyDbConnectionFactory readConnectionFactory,
    IScopeContextProvider scopeContextProvider) : IFindingsSnapshotRepository
{
    private readonly ISqlConnectionFactory _writeConnectionFactory =
        writeConnectionFactory ?? throw new ArgumentNullException(nameof(writeConnectionFactory));

    private readonly IReadOnlyDbConnectionFactory _readConnectionFactory =
        readConnectionFactory ?? throw new ArgumentNullException(nameof(readConnectionFactory));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    public async Task SaveAsync(
        FindingsSnapshot snapshot,
        CancellationToken ct,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null)
    {
        ArgumentNullException.ThrowIfNull(snapshot);

        if (connection is not null)
        {
            await SaveCoreAsync(snapshot, connection, transaction, ct);
            return;
        }

        await using SqlConnection owned = await _writeConnectionFactory.CreateOpenConnectionAsync(ct);
        await using SqlTransaction tx = owned.BeginTransaction();

        try
        {
            await SaveCoreAsync(snapshot, owned, tx, ct);
            tx.Commit();
        }
        catch
        {
            tx.Rollback();
            throw;
        }
    }

    public async Task<FindingsSnapshot?> GetByIdAsync(ScopeContext scope, Guid findingsSnapshotId, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);

        DynamicParameters parameters = BuildSnapshotIdParameters(scope, findingsSnapshotId);
        Stopwatch sw = Stopwatch.StartNew();

        try
        {
            await using SqlConnection connection = await _readConnectionFactory.CreateOpenConnectionAsync(ct);
            FindingsSnapshotStorageRow? row = await connection.QuerySingleOrDefaultAsync<FindingsSnapshotStorageRow>(
                new CommandDefinition(
                    FindingsSnapshotStatementFactory.BuildSelectHeaderById(scope),
                    parameters,
                    cancellationToken: ct));

            if (row is null)
                return null;

            int recordCount = await SqlRelationalScalarCount.ExecuteAsync(
                connection,
                null,
                FindingsSnapshotStatementFactory.BuildCountFindingRecords(scope),
                parameters,
                ct);

            if (recordCount == 0)
                return FindingsSnapshotJsonFallbackMapper.Map(row);

            FindingsSnapshot snapshot =
                await FindingsSnapshotRelationalRead.LoadRelationalSnapshotAsync(connection, row, scope, ct);
            FindingsSnapshotMetadataMerger.MergeFromFindingsJson(snapshot, row.FindingsJson);
            FindingsSnapshotMigrator.Apply(snapshot);
            return snapshot;
        }
        finally
        {
            ArchLucidInstrumentation.RecordNamedQueryLatencyMilliseconds(
                NamedQueryTelemetryNames.GetFindingsSnapshotById,
                sw.Elapsed.TotalMilliseconds);
        }
    }

    /// <inheritdoc />
    public async Task<FindingsSnapshot?> GetCoverageProjectionByIdAsync(
        ScopeContext scope,
        Guid findingsSnapshotId,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);

        DynamicParameters parameters = BuildSnapshotIdParameters(scope, findingsSnapshotId);

        await using SqlConnection connection = await _readConnectionFactory.CreateOpenConnectionAsync(ct);
        FindingsCoverageHeaderRow? header = await connection.QuerySingleOrDefaultAsync<FindingsCoverageHeaderRow>(
            new CommandDefinition(
                FindingsSnapshotStatementFactory.BuildSelectCoverageHeaderById(scope),
                parameters,
                cancellationToken: ct));

        if (header is null)
            return null;

        IReadOnlyList<FindingsCoverageFindingRow> findingRows =
            (await connection.QueryAsync<FindingsCoverageFindingRow>(
                new CommandDefinition(
                    FindingsSnapshotStatementFactory.BuildSelectCoverageFindingMetadata(scope),
                    parameters,
                    cancellationToken: ct))).AsList();

        if (findingRows.Count == 0)
            return await LoadCoverageFromLegacyJsonAsync(scope, findingsSnapshotId, ct);

        return FindingsCoverageProjectionMapper.Map(header, findingRows);
    }

    /// <inheritdoc />
    public async Task<FindingRecordMetadataPage> ListFindingRecordsKeysetAsync(
        ScopeContext scope,
        Guid findingsSnapshotId,
        int? cursorSortOrder,
        Guid? cursorFindingRecordId,
        int? cursorPriorityRank,
        string? severity,
        string? category,
        string? findingType,
        int take,
        bool orderByPriority,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);

        FindingRecordKeysetPageRequest request = new(
            findingsSnapshotId,
            cursorSortOrder,
            cursorFindingRecordId,
            cursorPriorityRank,
            severity,
            category,
            findingType,
            take,
            orderByPriority);
        request.Validate();

        await using SqlConnection connection = await _readConnectionFactory.CreateOpenConnectionAsync(ct);
        return await FindingRecordKeysetPageReader.ReadAsync(connection, scope, request, ct);
    }

    public async Task UpdatePriorityRanksAsync(
        ScopeContext scope,
        Guid findingsSnapshotId,
        IReadOnlyList<(string FindingId, int PriorityRank)> ranks,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(ranks);

        List<(string FindingId, int PriorityRank)> normalized = FindingPriorityRankUpdateBatch.Normalize(ranks);

        if (normalized.Count == 0)
            return;

        await using SqlConnection connection = await _writeConnectionFactory.CreateOpenConnectionAsync(ct);

        await SqlChunkedDapperBatch.ExecuteChunksAsync(
            connection,
            transaction: null,
            normalized.Count,
            SqlChunkedDapperBatch.DefaultMaxRowsPerCommand,
            (offset, rowCount) => FindingPriorityRankUpdateBatch.BuildChunk(
                findingsSnapshotId,
                scope,
                normalized,
                offset,
                rowCount),
            ct).ConfigureAwait(false);
    }

    /// <summary>
    ///     Inserts relational finding rows when <c>FindingRecords</c> is still empty (idempotent).
    /// </summary>
    internal static async Task BackfillRelationalSlicesAsync(
        FindingsSnapshot snapshot,
        IDbConnection connection,
        IDbTransaction? transaction,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(snapshot);
        ArgumentNullException.ThrowIfNull(connection);

        int recordCount = await SqlRelationalScalarCount.ExecuteAsync(
            connection,
            transaction,
            FindingsSnapshotWriteSql.CountFindingRecordsBySnapshotId,
            new { snapshot.FindingsSnapshotId },
            ct);

        if (recordCount > 0 || snapshot.Findings.Count == 0)
            return;

        FindingsSnapshotMigrator.Apply(snapshot);

        FindingsSnapshotScopeTripleRow? scopeHdr =
            await connection.QuerySingleOrDefaultAsync<FindingsSnapshotScopeTripleRow>(
                new CommandDefinition(
                    FindingsSnapshotWriteSql.SelectScopeTripleForBackfill,
                    new { snapshot.FindingsSnapshotId },
                    transaction,
                    cancellationToken: ct));

        if (scopeHdr?.TenantId is null || scopeHdr.WorkspaceId is null || scopeHdr.ProjectId is null)
            throw new InvalidOperationException(
                $"dbo.FindingsSnapshots row {snapshot.FindingsSnapshotId} lacks denormalized RLS scope (tenant/workspace/project); cannot backfill FindingRecords.");

        await FindingRelationalWriter.InsertSnapshotFindingsAsync(
            snapshot,
            connection,
            transaction,
            new FindingRelationalScope(
                scopeHdr.TenantId!.Value,
                scopeHdr.WorkspaceId!.Value,
                scopeHdr.ProjectId!.Value),
            ct);
    }

    private static DynamicParameters BuildSnapshotIdParameters(ScopeContext scope, Guid findingsSnapshotId)
    {
        DynamicParameters parameters = new();
        parameters.Add("FindingsSnapshotId", findingsSnapshotId);
        PersistenceTenantScope.AddScopeTripleIfNeeded(parameters, scope);
        return parameters;
    }

    /// <summary>
    ///     Legacy JSON-only snapshots have no coverage rows to project, so hydrate the full snapshot once and drop payloads
    ///     to keep the coverage response shape payload-free.
    /// </summary>
    private async Task<FindingsSnapshot?> LoadCoverageFromLegacyJsonAsync(
        ScopeContext scope,
        Guid findingsSnapshotId,
        CancellationToken ct)
    {
        FindingsSnapshot? full = await GetByIdAsync(scope, findingsSnapshotId, ct);

        if (full is null)
            return null;

        FindingsSnapshotListNormalizer.CoerceNullLists(full);

        foreach (Finding finding in full.Findings)
            finding.Payload = null;

        return full;
    }

    private async Task SaveCoreAsync(
        FindingsSnapshot snapshot,
        IDbConnection connection,
        IDbTransaction? transaction,
        CancellationToken ct)
    {
        FindingsSnapshotMigrator.Apply(snapshot);

        FindingRelationalScope scope =
            FindingRelationalScope.FromScopeContext(_scopeContextProvider.GetCurrentScope());

        await FindingsSnapshotHeaderWriter.InsertAsync(snapshot, connection, transaction, scope, ct);
        await FindingRelationalWriter.InsertSnapshotFindingsAsync(snapshot, connection, transaction, scope, ct);
    }
}
