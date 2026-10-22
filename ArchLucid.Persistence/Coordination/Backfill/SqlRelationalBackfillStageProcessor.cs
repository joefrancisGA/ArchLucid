using System.Diagnostics.CodeAnalysis;

using ArchLucid.Persistence.Connections;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Persistence.Coordination.Backfill;

/// <summary>Shared paging, checkpoint, and quarantine loop for backfill stages.</summary>
[ExcludeFromCodeCoverage(Justification =
    "Orchestrates SQL stores; stage-specific work is delegated and integration-tested end-to-end.")]
internal static class SqlRelationalBackfillStageProcessor
{
    public static async Task ProcessGuidStageAsync(
        string stage,
        SqlRelationalBackfillOptions options,
        SqlRelationalBackfillReport report,
        ISqlConnectionFactory connectionFactory,
        SqlRelationalBackfillCheckpointStore checkpoints,
        SqlRelationalBackfillFailureQuarantineStore quarantine,
        string tableName,
        string idColumnName,
        Func<Guid, CancellationToken, Task> processEntityAsync,
        ILogger logger,
        CancellationToken ct)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(stage);
        ArgumentNullException.ThrowIfNull(options);
        ArgumentNullException.ThrowIfNull(report);
        ArgumentNullException.ThrowIfNull(processEntityAsync);
        ArgumentNullException.ThrowIfNull(logger);

        SqlRelationalBackfillCursor cursor = await checkpoints.GetCursorAsync(stage, ct);

        while (!ct.IsCancellationRequested)
        {
            IReadOnlyList<SqlRelationalBackfillGuidPageRow> page = await SqlRelationalBackfillPagedEntityLoader.LoadGuidPageAsync(
                connectionFactory,
                tableName,
                idColumnName,
                cursor,
                options.BatchSize,
                ct);

            if (page.Count == 0)
                break;

            SqlRelationalBackfillCursor checkpointCandidate = cursor;
            bool stopPage = false;

            foreach (SqlRelationalBackfillGuidPageRow row in page)
            {
                string entityKey = row.EntityId.ToString("D");
                SqlRelationalBackfillCursor rowCursor = new(row.CreatedUtc, row.EntityId);

                if (await quarantine.ShouldSkipAsync(stage, entityKey, options.MaxRetries, options.ForceRetry, ct))
                {
                    report.SkippedQuarantinedCount++;
                    checkpointCandidate = rowCursor;

                    continue;
                }

                report.ProcessedCount++;

                try
                {
                    await processEntityAsync(row.EntityId, ct);
                    report.SuccessCount++;
                    await quarantine.ClearAsync(stage, entityKey, ct);
                    checkpointCandidate = rowCursor;
                    logger.LogInformation("Backfill {Stage}: completed {EntityKey}", stage, entityKey);
                }
                catch (Exception ex) when (!ct.IsCancellationRequested)
                {
                    report.FailureCount++;
                    report.Failures.Add(
                        new SqlRelationalBackfillFailure
                        {
                            Stage = stage, EntityKey = entityKey, Message = ex.Message
                        });

                    await quarantine.RecordFailureAsync(stage, entityKey, ex.Message, options.MaxRetries, ct);
                    logger.LogError(ex, "Backfill {Stage}: failed {EntityKey}", stage, entityKey);
                    stopPage = true;

                    break;
                }
            }

            cursor = checkpointCandidate;
            await checkpoints.SaveCursorAsync(stage, cursor, ct);

            if (stopPage || page.Count < options.BatchSize)
                break;
        }
    }
}
