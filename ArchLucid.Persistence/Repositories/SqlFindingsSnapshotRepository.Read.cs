using System.Diagnostics;

using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Infrastructure;
using ArchLucid.Persistence.Findings;
using ArchLucid.Persistence.RelationalRead;
using ArchLucid.Persistence.Sql;
using ArchLucid.Persistence.Telemetry;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Repositories;

public sealed partial class SqlFindingsSnapshotRepository
{
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
}
