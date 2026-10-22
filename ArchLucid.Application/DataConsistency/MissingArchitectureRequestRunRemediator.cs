using System.Data.Common;
using System.Globalization;

using ArchLucid.Core.Configuration;
using ArchLucid.Persistence.Data.Infrastructure;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.DataConsistency;

/// <summary>Soft-archives runs missing ArchitectureRequest rows (admin diagnostics + optional auto-remediation).</summary>
public interface IMissingArchitectureRequestRunRemediator
{
    Task<MissingArchitectureRequestRemediationOutcome> RemediateAsync(
        bool dryRun,
        int maxRows,
        CancellationToken cancellationToken);
}

/// <summary>Result of a missing-ArchitectureRequest remediation pass.</summary>
public sealed record MissingArchitectureRequestRemediationOutcome(
    bool DryRun,
    long CandidateCount,
    IReadOnlyList<string> CandidateRunIds,
    IReadOnlyList<string> ArchivedRunIds,
    IReadOnlyList<string> SkippedRunIds);

/// <inheritdoc cref="IMissingArchitectureRequestRunRemediator" />
public sealed class MissingArchitectureRequestRunRemediator(
    IDbConnectionFactory connectionFactory,
    IRunRepository runRepository,
    IArchLucidStorageMode storageMode,
    IOptionsMonitor<MissingArchitectureRequestAutoRemediationOptions> optionsMonitor,
    ILogger<MissingArchitectureRequestRunRemediator> logger) : IMissingArchitectureRequestRunRemediator
{
    private readonly IDbConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    private readonly ILogger<MissingArchitectureRequestRunRemediator> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    private readonly IOptionsMonitor<MissingArchitectureRequestAutoRemediationOptions> _optionsMonitor =
        optionsMonitor ?? throw new ArgumentNullException(nameof(optionsMonitor));

    private readonly IRunRepository _runRepository =
        runRepository ?? throw new ArgumentNullException(nameof(runRepository));

    private readonly IArchLucidStorageMode _storageMode =
        storageMode ?? throw new ArgumentNullException(nameof(storageMode));

    /// <inheritdoc />
    public async Task<MissingArchitectureRequestRemediationOutcome> RemediateAsync(
        bool dryRun,
        int maxRows,
        CancellationToken cancellationToken)
    {
        if (_storageMode.IsInMemory)
            return new MissingArchitectureRequestRemediationOutcome(dryRun, 0, [], [], []);

        int capped = Math.Clamp(maxRows, 1, 500);
        int minAgeMinutes = Math.Clamp(_optionsMonitor.CurrentValue.MinAgeMinutes, 1, 24 * 60);

        await using DbConnection connection =
            (DbConnection)await _connectionFactory.CreateOpenConnectionAsync(cancellationToken).ConfigureAwait(false);

        long count = await ExecuteCountAsync(connection, minAgeMinutes, cancellationToken).ConfigureAwait(false);
        List<Guid> candidateIds =
            await ReadCandidateIdsAsync(connection, capped, minAgeMinutes, cancellationToken).ConfigureAwait(false);
        List<string> candidateStrings = candidateIds.ConvertAll(static id => id.ToString("D"));

        if (dryRun || candidateIds.Count == 0)
            return new MissingArchitectureRequestRemediationOutcome(dryRun, count, candidateStrings, [], []);

        RunArchiveByIdsResult archiveResult =
            await _runRepository.ArchiveRunsByIdsAsync(candidateIds, cancellationToken).ConfigureAwait(false);

        List<string> archived = archiveResult.SucceededRunIds.Select(static id => id.ToString("D")).ToList();
        List<string> skipped = archiveResult.Failed.Select(static f => f.RunId.ToString("D")).ToList();

        if (_logger.IsEnabled(LogLevel.Information))
        {
            _logger.LogInformation(
                "Missing ArchitectureRequest remediation archived {ArchivedCount} run(s); skipped {SkippedCount}.",
                archived.Count,
                skipped.Count);
        }

        return new MissingArchitectureRequestRemediationOutcome(dryRun, count, candidateStrings, archived, skipped);
    }

    private static async Task<long> ExecuteCountAsync(
        DbConnection connection,
        int minAgeMinutes,
        CancellationToken cancellationToken)
    {
        await using DbCommand command = connection.CreateCommand();
        command.CommandText = DataConsistencyMissingArchitectureRequestRemediationSql.CountMissingArchitectureRequestRuns;
        AddMinAgeParameter(command, minAgeMinutes);
        object? scalar = await command.ExecuteScalarAsync(cancellationToken).ConfigureAwait(false);

        return scalar is long value
            ? value
            : Convert.ToInt64(scalar ?? 0L, CultureInfo.InvariantCulture);
    }

    private static async Task<List<Guid>> ReadCandidateIdsAsync(
        DbConnection connection,
        int maxRows,
        int minAgeMinutes,
        CancellationToken cancellationToken)
    {
        List<Guid> ids = [];

        await using DbCommand command = connection.CreateCommand();
        command.CommandText = DataConsistencyMissingArchitectureRequestRemediationSql.SelectMissingArchitectureRequestRunIds;
        DbParameter maxRowsParameter = command.CreateParameter();
        maxRowsParameter.ParameterName = "@MaxRows";
        maxRowsParameter.Value = maxRows;
        command.Parameters.Add(maxRowsParameter);
        AddMinAgeParameter(command, minAgeMinutes);

        await using DbDataReader reader = await command.ExecuteReaderAsync(cancellationToken).ConfigureAwait(false);

        while (await reader.ReadAsync(cancellationToken).ConfigureAwait(false))
            ids.Add(reader.GetGuid(0));

        return ids;
    }

    private static void AddMinAgeParameter(DbCommand command, int minAgeMinutes)
    {
        DbParameter minAgeParameter = command.CreateParameter();
        minAgeParameter.ParameterName = "@MinAgeMinutes";
        minAgeParameter.Value = minAgeMinutes;
        command.Parameters.Add(minAgeParameter);
    }
}
