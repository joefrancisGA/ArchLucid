using System.Data.Common;
using System.Globalization;
using System.Text.Json;

using ArchLucid.Application.Common;
using ArchLucid.Contracts.Admin;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Integration;
using ArchLucid.Core.Pagination;
using ArchLucid.Core.Scoping;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.DataConsistency;
using ArchLucid.Persistence.Admin;
using ArchLucid.Persistence.Data.Infrastructure;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.IntegrationOutbox;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using Microsoft.Extensions.Options;

using MissingArchitectureRequestAutoRemediationOptions =
    ArchLucid.Application.DataConsistency.MissingArchitectureRequestAutoRemediationOptions;


namespace ArchLucid.Api.Services.Admin;

public interface IAdminDataConsistencyDiagnosticsService
{
    Task<DataConsistencyOrphanCounts> GetDataConsistencyOrphanCountsAsync(CancellationToken cancellationToken = default);
    Task<DataConsistencyHeaderRepointCounts> GetDataConsistencyHeaderRepointCountsAsync(CancellationToken cancellationToken = default);
    Task<CrossTenantUsageRollup> GetCrossTenantUsageRollupAsync(CancellationToken cancellationToken = default);
    Task<OrphanComparisonRemediationResult> RemediateOrphanComparisonRecordsAsync(bool dryRun, int maxRows, CancellationToken cancellationToken = default);
    Task<OrphanGoldenManifestRemediationResult> RemediateOrphanGoldenManifestsAsync(bool dryRun, int maxRows, CancellationToken cancellationToken = default);
    Task<OrphanFindingsSnapshotRemediationResult> RemediateOrphanFindingsSnapshotsAsync(bool dryRun, int maxRows, CancellationToken cancellationToken = default);
    Task<DataConsistencyStaleInFlightSnapshot> GetDataConsistencyStaleInFlightSnapshotAsync(int maxSampleRows = 50, CancellationToken cancellationToken = default);
    Task<StaleInFlightRemediationResult> RemediateStaleInFlightRunsAsync(bool dryRun, int maxRows, CancellationToken cancellationToken = default);
    Task<DataConsistencyMissingArchitectureRequestSnapshot> GetDataConsistencyMissingArchitectureRequestSnapshotAsync(int maxSampleRows = 50, CancellationToken cancellationToken = default);
    Task<MissingArchitectureRequestRemediationResult> RemediateMissingArchitectureRequestRunsAsync(bool dryRun, int maxRows, CancellationToken cancellationToken = default);
}

public sealed class AdminDataConsistencyDiagnosticsService(
    IRunRepository runRepository,
    IDbConnectionFactory connectionFactory,
    IOptions<ArchLucidOptions> archLucidOptions,
    IOptionsMonitor<MissingArchitectureRequestAutoRemediationOptions> missingArchitectureRequestAutoRemediationOptions,
    IDataConsistencyRemediationExecutor dataConsistencyRemediationExecutor,
    IAdminRunArchiveAuditLogger archiveAuditLogger) : IAdminDataConsistencyDiagnosticsService
{
    private readonly IAdminRunArchiveAuditLogger _archiveAuditLogger =
        archiveAuditLogger ?? throw new ArgumentNullException(nameof(archiveAuditLogger));

    private readonly IOptions<ArchLucidOptions> _archLucidOptions =
        archLucidOptions ?? throw new ArgumentNullException(nameof(archLucidOptions));

    private readonly IOptionsMonitor<MissingArchitectureRequestAutoRemediationOptions>
        _missingArchitectureRequestAutoRemediationOptions =
            missingArchitectureRequestAutoRemediationOptions
            ?? throw new ArgumentNullException(nameof(missingArchitectureRequestAutoRemediationOptions));

    private readonly IDataConsistencyRemediationExecutor _dataConsistencyRemediationExecutor =
        dataConsistencyRemediationExecutor
        ?? throw new ArgumentNullException(nameof(dataConsistencyRemediationExecutor));

    private readonly IDbConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    private readonly IRunRepository _runRepository =
        runRepository ?? throw new ArgumentNullException(nameof(runRepository));

public async Task<DataConsistencyOrphanCounts> GetDataConsistencyOrphanCountsAsync(
    CancellationToken cancellationToken = default)
{
    if (ArchLucidOptions.EffectiveIsInMemory(_archLucidOptions.Value.StorageProvider))
        return new DataConsistencyOrphanCounts(0, 0, 0, 0, 0, 0);

    DbConnection connection = (DbConnection)_connectionFactory.CreateConnection();
    await using DbConnection _ = connection;
    await connection.OpenAsync(cancellationToken);

    long golden = await AdminDiagnosticsSqlSupport.ExecuteCountAsync(connection, DataConsistencyOrphanProbeSql.GoldenManifestsRunId,
        cancellationToken);
    long findings = await AdminDiagnosticsSqlSupport.ExecuteCountAsync(connection, DataConsistencyOrphanProbeSql.FindingsSnapshotsRunId,
        cancellationToken);
    long contextSnapshots = await AdminDiagnosticsSqlSupport.ExecuteCountAsync(connection, DataConsistencyOrphanProbeSql.ContextSnapshotsRunId,
        cancellationToken);
    long graphSnapshots = await AdminDiagnosticsSqlSupport.ExecuteCountAsync(connection, DataConsistencyOrphanProbeSql.GraphSnapshotsRunId,
        cancellationToken);

    return new DataConsistencyOrphanCounts(0, 0, golden, findings, contextSnapshots, graphSnapshots);
}

/// <inheritdoc />
public async Task<DataConsistencyHeaderRepointCounts> GetDataConsistencyHeaderRepointCountsAsync(
    CancellationToken cancellationToken = default)
{
    if (ArchLucidOptions.EffectiveIsInMemory(_archLucidOptions.Value.StorageProvider))
        return new DataConsistencyHeaderRepointCounts(0, 0, 0, 0, 0, 0);

    DbConnection connection = (DbConnection)_connectionFactory.CreateConnection();
    await using DbConnection _ = connection;
    await connection.OpenAsync(cancellationToken);

    long contextSnapshotId = await AdminDiagnosticsSqlSupport.ExecuteCountAsync(
        connection,
        CommittedRunHeaderFkRepointProbeSql.ContextSnapshotId,
        cancellationToken);
    long graphSnapshotId = await AdminDiagnosticsSqlSupport.ExecuteCountAsync(
        connection,
        CommittedRunHeaderFkRepointProbeSql.GraphSnapshotId,
        cancellationToken);
    long findingsSnapshotId = await AdminDiagnosticsSqlSupport.ExecuteCountAsync(
        connection,
        CommittedRunHeaderFkRepointProbeSql.FindingsSnapshotId,
        cancellationToken);
    long goldenManifestId = await AdminDiagnosticsSqlSupport.ExecuteCountAsync(
        connection,
        CommittedRunHeaderFkRepointProbeSql.GoldenManifestId,
        cancellationToken);
    long decisionTraceId = await AdminDiagnosticsSqlSupport.ExecuteCountAsync(
        connection,
        CommittedRunHeaderFkRepointProbeSql.DecisionTraceId,
        cancellationToken);
    long artifactBundleId = await AdminDiagnosticsSqlSupport.ExecuteCountAsync(
        connection,
        CommittedRunHeaderFkRepointProbeSql.ArtifactBundleId,
        cancellationToken);

    return new DataConsistencyHeaderRepointCounts(
        contextSnapshotId,
        graphSnapshotId,
        findingsSnapshotId,
        goldenManifestId,
        decisionTraceId,
        artifactBundleId);
}


public async Task<CrossTenantUsageRollup> GetCrossTenantUsageRollupAsync(
    CancellationToken cancellationToken = default)
{
    if (ArchLucidOptions.EffectiveIsInMemory(_archLucidOptions.Value.StorageProvider))
        return new CrossTenantUsageRollup(0, 0, 0, TimeProvider.System.GetUtcNow());

    DbConnection connection = (DbConnection)_connectionFactory.CreateConnection();
    await using DbConnection _ = connection;
    await connection.OpenAsync(cancellationToken);

    long totalRuns =
        await AdminDiagnosticsSqlSupport.ExecuteCountAsync(connection, "SELECT COUNT_BIG(*) FROM dbo.Runs;", cancellationToken);

    long committedRuns =
        await AdminDiagnosticsSqlSupport.ExecuteCountAsync(connection,
            "SELECT COUNT_BIG(*) FROM dbo.Runs WHERE GoldenManifestId IS NOT NULL;",
            cancellationToken);

    long distinctTenants =
        await AdminDiagnosticsSqlSupport.ExecuteCountAsync(connection,
            "SELECT COUNT_BIG(DISTINCT TenantId) FROM dbo.Runs;",
            cancellationToken);

    return new CrossTenantUsageRollup(distinctTenants, committedRuns, totalRuns, TimeProvider.System.GetUtcNow());
}

public async Task<OrphanComparisonRemediationResult> RemediateOrphanComparisonRecordsAsync(
    bool dryRun,
    int maxRows,
    CancellationToken cancellationToken = default)
{
    if (ArchLucidOptions.EffectiveIsInMemory(_archLucidOptions.Value.StorageProvider))
        return new OrphanComparisonRemediationResult(dryRun, 0, []);

    DataConsistencyRemediationResult result = await _dataConsistencyRemediationExecutor.ExecuteAsync(
        DataConsistencyOrphanRemediationRegistry.ComparisonRecords,
        dryRun,
        maxRows,
        cancellationToken).ConfigureAwait(false);

    return new OrphanComparisonRemediationResult(result.DryRun, result.RowCount, result.RemediatedIds);
}

/// <inheritdoc />
public async Task<OrphanGoldenManifestRemediationResult> RemediateOrphanGoldenManifestsAsync(
    bool dryRun,
    int maxRows,
    CancellationToken cancellationToken = default)
{
    if (ArchLucidOptions.EffectiveIsInMemory(_archLucidOptions.Value.StorageProvider))
        return new OrphanGoldenManifestRemediationResult(dryRun, 0, []);

    DataConsistencyRemediationResult result = await _dataConsistencyRemediationExecutor.ExecuteAsync(
        DataConsistencyOrphanRemediationRegistry.GoldenManifests,
        dryRun,
        maxRows,
        cancellationToken).ConfigureAwait(false);

    return new OrphanGoldenManifestRemediationResult(result.DryRun, result.RowCount, result.RemediatedIds);
}

/// <inheritdoc />
public async Task<OrphanFindingsSnapshotRemediationResult> RemediateOrphanFindingsSnapshotsAsync(
    bool dryRun,
    int maxRows,
    CancellationToken cancellationToken = default)
{
    if (ArchLucidOptions.EffectiveIsInMemory(_archLucidOptions.Value.StorageProvider))
        return new OrphanFindingsSnapshotRemediationResult(dryRun, 0, []);

    DataConsistencyRemediationResult result = await _dataConsistencyRemediationExecutor.ExecuteAsync(
        DataConsistencyOrphanRemediationRegistry.FindingsSnapshots,
        dryRun,
        maxRows,
        cancellationToken).ConfigureAwait(false);

    return new OrphanFindingsSnapshotRemediationResult(result.DryRun, result.RowCount, result.RemediatedIds);
}

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
