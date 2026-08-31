using System.Data.Common;

using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Configuration;
using ArchLucid.Persistence.Data.Infrastructure;
using ArchLucid.Persistence.Interfaces;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.DataConsistency;

public interface IHungReviewExecuteWatchdog
{
    Task<HungReviewExecuteWatchdogOutcome> RemediateAsync(CancellationToken cancellationToken);
}

public sealed record HungReviewExecuteWatchdogOutcome(
    int CandidateCount,
    IReadOnlyList<string> FailedRunIds);

/// <summary>
///     Marks runs stuck in <see cref="ArchitectureRunStatus.WaitingForResults" /> as failed so operators are not blocked
///     by a silent server-side hang.
/// </summary>
public sealed class HungReviewExecuteWatchdog(
    IDbConnectionFactory connectionFactory,
    IArchLucidStorageMode storageMode,
    IOptions<HungReviewExecuteWatchdogOptions> options,
    ILogger<HungReviewExecuteWatchdog> logger) : IHungReviewExecuteWatchdog
{
    private readonly IDbConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    private readonly IArchLucidStorageMode _storageMode =
        storageMode ?? throw new ArgumentNullException(nameof(storageMode));

    private readonly IOptions<HungReviewExecuteWatchdogOptions> _options =
        options ?? throw new ArgumentNullException(nameof(options));

    private readonly ILogger<HungReviewExecuteWatchdog> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    public async Task<HungReviewExecuteWatchdogOutcome> RemediateAsync(CancellationToken cancellationToken)
    {
        HungReviewExecuteWatchdogOptions settings = _options.Value;

        if (!settings.Enabled || _storageMode.IsInMemory)
            return new HungReviewExecuteWatchdogOutcome(0, []);

        int maxRows = Math.Clamp(settings.MaxRowsPerPass, 1, 200);
        int staleHours = Math.Clamp(settings.StaleHours, 1, 72);

        await using DbConnection connection =
            (DbConnection)await _connectionFactory.CreateOpenConnectionAsync(cancellationToken).ConfigureAwait(false);

        List<Guid> candidateIds = await ReadCandidateIdsAsync(connection, maxRows, staleHours, cancellationToken)
            .ConfigureAwait(false);

        if (candidateIds.Count == 0)
            return new HungReviewExecuteWatchdogOutcome(0, []);

        string failureSummary = AgentExecutionFailureSummaryJson.Serialize(new AgentExecutionFailureSummary
        {
            FailureClass = AgentExecutionFailureClasses.Timeout,
            ReasonCode = "hung_review_execute_watchdog",
            TriageScenarioId = "hung-review-execute",
        });

        List<string> failed = [];

        foreach (Guid runId in candidateIds)
        {
            int updated = await MarkFailedAsync(connection, runId, failureSummary, cancellationToken).ConfigureAwait(false);

            if (updated > 0)
                failed.Add(runId.ToString("D"));
        }

        if (logger.IsEnabled(LogLevel.Information) && failed.Count > 0)
        {
            logger.LogInformation(
                "Hung review execute watchdog marked {FailedCount} run(s) as failed.",
                failed.Count);
        }

        return new HungReviewExecuteWatchdogOutcome(candidateIds.Count, failed);
    }

    private static async Task<List<Guid>> ReadCandidateIdsAsync(
        DbConnection connection,
        int maxRows,
        int staleHours,
        CancellationToken cancellationToken)
    {
        List<Guid> ids = [];

        await using DbCommand command = connection.CreateCommand();
        command.CommandText = HungReviewExecuteWatchdogSql.SelectHungExecuteRunIds;

        DbParameter maxRowsParameter = command.CreateParameter();
        maxRowsParameter.ParameterName = "@MaxRows";
        maxRowsParameter.Value = maxRows;
        command.Parameters.Add(maxRowsParameter);

        DbParameter staleHoursParameter = command.CreateParameter();
        staleHoursParameter.ParameterName = "@StaleHours";
        staleHoursParameter.Value = staleHours;
        command.Parameters.Add(staleHoursParameter);

        await using DbDataReader reader = await command.ExecuteReaderAsync(cancellationToken).ConfigureAwait(false);

        while (await reader.ReadAsync(cancellationToken).ConfigureAwait(false))
            ids.Add(reader.GetGuid(0));

        return ids;
    }

    private static async Task<int> MarkFailedAsync(
        DbConnection connection,
        Guid runId,
        string failureSummary,
        CancellationToken cancellationToken)
    {
        await using DbCommand command = connection.CreateCommand();
        command.CommandText = HungReviewExecuteWatchdogSql.MarkHungExecuteRunFailed;

        DbParameter runIdParameter = command.CreateParameter();
        runIdParameter.ParameterName = "@RunId";
        runIdParameter.Value = runId;
        command.Parameters.Add(runIdParameter);

        DbParameter failureParameter = command.CreateParameter();
        failureParameter.ParameterName = "@LastFailureReason";
        failureParameter.Value = failureSummary;
        command.Parameters.Add(failureParameter);

        DbParameter statusParameter = command.CreateParameter();
        statusParameter.ParameterName = "@FailedStatus";
        statusParameter.Value = nameof(ArchitectureRunStatus.Failed);
        command.Parameters.Add(statusParameter);

        object? scalar = await command.ExecuteScalarAsync(cancellationToken).ConfigureAwait(false);

        return scalar is int value ? value : Convert.ToInt32(scalar ?? 0, System.Globalization.CultureInfo.InvariantCulture);
    }
}
