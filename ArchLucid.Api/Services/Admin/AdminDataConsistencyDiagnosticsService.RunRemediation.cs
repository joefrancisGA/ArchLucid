using System.Data.Common;

using ArchLucid.Contracts.Admin;
using ArchLucid.Core.Integration;
using ArchLucid.Core.Pagination;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.DataConsistency;
using ArchLucid.Persistence.Admin;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Api.Services.Admin;

public sealed partial class AdminDataConsistencyDiagnosticsService
{
    /// <inheritdoc />
    public async Task<DataConsistencyStaleInFlightSnapshot> GetDataConsistencyStaleInFlightSnapshotAsync(
        int maxSampleRows = 50,
        CancellationToken cancellationToken = default)
    {
        if (ArchLucidOptions.EffectiveIsInMemory(_archLucidOptions.Value.StorageProvider))
            return new DataConsistencyStaleInFlightSnapshot(0, []);

        int capped = Math.Clamp(maxSampleRows, 1, PaginationDefaults.MaxListingTake);
        DbConnection connection = (DbConnection)_connectionFactory.CreateConnection();
        await using DbConnection _ = connection;
        await connection.OpenAsync(cancellationToken);

        long count = await AdminDiagnosticsSqlSupport.ExecuteCountAsync(
            connection,
            DataConsistencyStaleInFlightRemediationSql.CountStaleInFlightRuns,
            cancellationToken);

        List<string> sampleIds = [];

        await using (DbCommand selectCommand = connection.CreateCommand())
        {
            selectCommand.CommandText = DataConsistencyStaleInFlightRemediationSql.SelectStaleInFlightRunIds;
            DbParameter maxRowsParameter = selectCommand.CreateParameter();
            maxRowsParameter.ParameterName = "@MaxRows";
            maxRowsParameter.Value = capped;
            selectCommand.Parameters.Add(maxRowsParameter);

            await using DbDataReader reader = await selectCommand.ExecuteReaderAsync(cancellationToken);

            while (await reader.ReadAsync(cancellationToken))
                sampleIds.Add(reader.GetGuid(0).ToString("D"));
        }

        return new DataConsistencyStaleInFlightSnapshot(count, sampleIds);
    }

    /// <inheritdoc />
    public async Task<StaleInFlightRemediationResult> RemediateStaleInFlightRunsAsync(
        bool dryRun,
        int maxRows,
        CancellationToken cancellationToken = default)
    {
        if (ArchLucidOptions.EffectiveIsInMemory(_archLucidOptions.Value.StorageProvider))
            return new StaleInFlightRemediationResult(dryRun, 0, [], [], []);

        int capped = Math.Clamp(maxRows, 1, PaginationDefaults.MaxListingTake);
        DbConnection connection = (DbConnection)_connectionFactory.CreateConnection();
        await using DbConnection _ = connection;
        await connection.OpenAsync(cancellationToken);

        List<Guid> candidateIds = [];

        await using (DbCommand selectCommand = connection.CreateCommand())
        {
            selectCommand.CommandText = DataConsistencyStaleInFlightRemediationSql.SelectStaleInFlightRunIds;
            DbParameter maxRowsParameter = selectCommand.CreateParameter();
            maxRowsParameter.ParameterName = "@MaxRows";
            maxRowsParameter.Value = capped;
            selectCommand.Parameters.Add(maxRowsParameter);

            await using DbDataReader reader = await selectCommand.ExecuteReaderAsync(cancellationToken);

            while (await reader.ReadAsync(cancellationToken))
                candidateIds.Add(reader.GetGuid(0));
        }

        IReadOnlyList<string> candidateIdStrings =
            candidateIds.Select(static id => id.ToString("D")).ToList();

        if (dryRun)
            return new StaleInFlightRemediationResult(true, candidateIds.Count, candidateIdStrings, [], []);

        if (candidateIds.Count == 0)
            return new StaleInFlightRemediationResult(false, 0, [], [], []);

        RunArchiveByIdsResult archiveResult =
            await _runRepository.ArchiveRunsByIdsAsync(candidateIds, cancellationToken);

        if (archiveResult.SucceededRunIds.Count > 0)
        {
            await _archiveAuditLogger.LogManifestArchivedBatchAsync(
                "staleInFlight",
                archiveResult.SucceededRunIds.Count,
                archiveResult.SucceededRunIds.Select(static r => r.ToString("D")).ToList(),
                archiveResult.ChildCascade,
                cancellationToken);
        }

        return new StaleInFlightRemediationResult(
            false,
            candidateIds.Count,
            candidateIdStrings,
            archiveResult.SucceededRunIds.Select(static r => r.ToString("D")).ToList(),
            archiveResult.Failed);
    }

    /// <inheritdoc />
    public async Task<DataConsistencyMissingArchitectureRequestSnapshot>
        GetDataConsistencyMissingArchitectureRequestSnapshotAsync(
            int maxSampleRows = 50,
            CancellationToken cancellationToken = default)
    {
        if (ArchLucidOptions.EffectiveIsInMemory(_archLucidOptions.Value.StorageProvider))
            return new DataConsistencyMissingArchitectureRequestSnapshot(0, []);

        int capped = Math.Clamp(maxSampleRows, 1, PaginationDefaults.MaxListingTake);
        int minAgeMinutes = ResolveMissingArchitectureRequestMinAgeMinutes();
        DbConnection connection = (DbConnection)_connectionFactory.CreateConnection();
        await using DbConnection _ = connection;
        await connection.OpenAsync(cancellationToken);

        long count = await AdminDiagnosticsSqlSupport.ExecuteCountWithMinAgeAsync(
            connection,
            DataConsistencyMissingArchitectureRequestRemediationSql.CountMissingArchitectureRequestRuns,
            minAgeMinutes,
            cancellationToken);

        List<string> sampleIds = [];

        await using (DbCommand selectCommand = connection.CreateCommand())
        {
            selectCommand.CommandText =
                DataConsistencyMissingArchitectureRequestRemediationSql.SelectMissingArchitectureRequestRunIds;
            AdminDiagnosticsSqlSupport.AddMaxRowsParameter(selectCommand, capped);
            AdminDiagnosticsSqlSupport.AddMinAgeParameter(selectCommand, minAgeMinutes);

            await using DbDataReader reader = await selectCommand.ExecuteReaderAsync(cancellationToken);

            while (await reader.ReadAsync(cancellationToken))
                sampleIds.Add(reader.GetGuid(0).ToString("D"));
        }

        return new DataConsistencyMissingArchitectureRequestSnapshot(count, sampleIds);
    }

    /// <inheritdoc />
    public async Task<MissingArchitectureRequestRemediationResult> RemediateMissingArchitectureRequestRunsAsync(
        bool dryRun,
        int maxRows,
        CancellationToken cancellationToken = default)
    {
        if (ArchLucidOptions.EffectiveIsInMemory(_archLucidOptions.Value.StorageProvider))
            return new MissingArchitectureRequestRemediationResult(dryRun, 0, [], [], []);

        int capped = Math.Clamp(maxRows, 1, PaginationDefaults.MaxListingTake);
        int minAgeMinutes = ResolveMissingArchitectureRequestMinAgeMinutes();
        DbConnection connection = (DbConnection)_connectionFactory.CreateConnection();
        await using DbConnection _ = connection;
        await connection.OpenAsync(cancellationToken);

        List<Guid> candidateIds = [];

        await using (DbCommand selectCommand = connection.CreateCommand())
        {
            selectCommand.CommandText =
                DataConsistencyMissingArchitectureRequestRemediationSql.SelectMissingArchitectureRequestRunIds;
            AdminDiagnosticsSqlSupport.AddMaxRowsParameter(selectCommand, capped);
            AdminDiagnosticsSqlSupport.AddMinAgeParameter(selectCommand, minAgeMinutes);

            await using DbDataReader reader = await selectCommand.ExecuteReaderAsync(cancellationToken);

            while (await reader.ReadAsync(cancellationToken))
                candidateIds.Add(reader.GetGuid(0));
        }

        IReadOnlyList<string> candidateIdStrings =
            candidateIds.Select(static id => id.ToString("D")).ToList();

        if (dryRun)
            return new MissingArchitectureRequestRemediationResult(true, candidateIds.Count, candidateIdStrings, [], []);

        if (candidateIds.Count == 0)
            return new MissingArchitectureRequestRemediationResult(false, 0, [], [], []);

        RunArchiveByIdsResult archiveResult =
            await _runRepository.ArchiveRunsByIdsAsync(candidateIds, cancellationToken);

        if (archiveResult.SucceededRunIds.Count > 0)
        {
            await _archiveAuditLogger.LogManifestArchivedBatchAsync(
                "missingArchitectureRequest",
                archiveResult.SucceededRunIds.Count,
                archiveResult.SucceededRunIds.Select(static r => r.ToString("D")).ToList(),
                archiveResult.ChildCascade,
                cancellationToken);
        }

        return new MissingArchitectureRequestRemediationResult(
            false,
            candidateIds.Count,
            candidateIdStrings,
            archiveResult.SucceededRunIds.Select(static r => r.ToString("D")).ToList(),
            archiveResult.Failed);
    }

    private int ResolveMissingArchitectureRequestMinAgeMinutes()
    {
        return Math.Clamp(_missingArchitectureRequestAutoRemediationOptions.CurrentValue.MinAgeMinutes, 1, 24 * 60);
    }
}
