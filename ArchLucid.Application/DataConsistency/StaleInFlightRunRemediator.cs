using System.Data.Common;
using System.Globalization;

using ArchLucid.Core.Configuration;
using ArchLucid.Persistence.Data.Infrastructure;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.DataConsistency;

/// <summary>Soft-archives stale in-flight runs (shared by admin diagnostics and optional auto-remediation).</summary>
public interface IStaleInFlightRunRemediator
{
    Task<StaleInFlightRemediationOutcome> RemediateAsync(bool dryRun, int maxRows, CancellationToken cancellationToken);
}

/// <summary>Result of a stale in-flight remediation pass.</summary>
public sealed record StaleInFlightRemediationOutcome(
    bool DryRun,
    long CandidateCount,
    IReadOnlyList<string> CandidateRunIds,
    IReadOnlyList<string> ArchivedRunIds,
    IReadOnlyList<string> SkippedRunIds);

/// <inheritdoc cref="IStaleInFlightRunRemediator" />
public sealed class StaleInFlightRunRemediator(
    IDbConnectionFactory connectionFactory,
    IRunRepository runRepository,
    IArchLucidStorageMode storageMode,
    ILogger<StaleInFlightRunRemediator> logger) : IStaleInFlightRunRemediator
{
    private readonly IDbConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    private readonly IArchLucidStorageMode _storageMode =
        storageMode ?? throw new ArgumentNullException(nameof(storageMode));

    private readonly ILogger<StaleInFlightRunRemediator> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    private readonly IRunRepository _runRepository =
        runRepository ?? throw new ArgumentNullException(nameof(runRepository));

    /// <inheritdoc />
    public async Task<StaleInFlightRemediationOutcome> RemediateAsync(
        bool dryRun,
        int maxRows,
        CancellationToken cancellationToken)
    {
        if (_storageMode.IsInMemory)
            return new StaleInFlightRemediationOutcome(dryRun, 0, [], [], []);

        int capped = Math.Clamp(maxRows, 1, 500);
        await using DbConnection connection =
            (DbConnection)await _connectionFactory.CreateOpenConnectionAsync(cancellationToken).ConfigureAwait(false);

        long count = await ExecuteCountAsync(connection, cancellationToken).ConfigureAwait(false);
        List<Guid> candidateIds = await ReadCandidateIdsAsync(connection, capped, cancellationToken).ConfigureAwait(false);
        List<string> candidateStrings = candidateIds.ConvertAll(static id => id.ToString("D"));

        if (dryRun || candidateIds.Count == 0)
            return new StaleInFlightRemediationOutcome(dryRun, count, candidateStrings, [], []);

        RunArchiveByIdsResult archiveResult =
            await _runRepository.ArchiveRunsByIdsAsync(candidateIds, cancellationToken).ConfigureAwait(false);

        List<string> archived = archiveResult.SucceededRunIds.Select(static id => id.ToString("D")).ToList();
        List<string> skipped = archiveResult.Failed.Select(static f => f.RunId.ToString("D")).ToList();

        if (_logger.IsEnabled(LogLevel.Information))
        {
            _logger.LogInformation(
                "Stale in-flight remediation archived {ArchivedCount} run(s); skipped {SkippedCount}.",
                archived.Count,
                skipped.Count);
        }

        return new StaleInFlightRemediationOutcome(dryRun, count, candidateStrings, archived, skipped);
    }

    private static async Task<long> ExecuteCountAsync(DbConnection connection, CancellationToken cancellationToken)
    {
        await using DbCommand command = connection.CreateCommand();
        command.CommandText = DataConsistencyStaleInFlightRemediationSql.CountStaleInFlightRuns;
        object? scalar = await command.ExecuteScalarAsync(cancellationToken).ConfigureAwait(false);

        return scalar is long value
            ? value
            : Convert.ToInt64(scalar ?? 0L, CultureInfo.InvariantCulture);
    }

    private static async Task<List<Guid>> ReadCandidateIdsAsync(
        DbConnection connection,
        int maxRows,
        CancellationToken cancellationToken)
    {
        List<Guid> ids = [];

        await using DbCommand command = connection.CreateCommand();
        command.CommandText = DataConsistencyStaleInFlightRemediationSql.SelectStaleInFlightRunIds;
        DbParameter parameter = command.CreateParameter();
        parameter.ParameterName = "@MaxRows";
        parameter.Value = maxRows;
        command.Parameters.Add(parameter);

        await using DbDataReader reader = await command.ExecuteReaderAsync(cancellationToken).ConfigureAwait(false);

        while (await reader.ReadAsync(cancellationToken).ConfigureAwait(false))
            ids.Add(reader.GetGuid(0));

        return ids;
    }
}
