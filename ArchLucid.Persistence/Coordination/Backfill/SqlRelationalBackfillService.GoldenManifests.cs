using ArchLucid.Core.Manifest;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Repositories;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Persistence.Coordination.Backfill;

public sealed partial class SqlRelationalBackfillService
{
    private async Task BackfillGoldenManifestsAsync(
        SqlRelationalBackfillOptions options,
        SqlRelationalBackfillReport report,
        CancellationToken ct)
    {
        const string stage = "GoldenManifestsPhase1";
        SqlRelationalBackfillCursor cursor = await _checkpoints.GetCursorAsync(stage, ct);

        while (!ct.IsCancellationRequested)
        {
            IReadOnlyList<SqlRelationalBackfillGoldenManifestPageRow> page =
                await SqlRelationalBackfillPagedEntityLoader.LoadGoldenManifestPageAsync(
                    connectionFactory,
                    cursor,
                    options.BatchSize,
                    ct);

            if (page.Count == 0)
                break;

            SqlRelationalBackfillCursor checkpointCandidate = cursor;
            bool stopPage = false;

            foreach (SqlRelationalBackfillGoldenManifestPageRow row in page)
            {
                string entityKey = row.ManifestId.ToString("D");
                SqlRelationalBackfillCursor rowCursor = new(row.CreatedUtc, row.ManifestId);

                if (await _quarantine.ShouldSkipAsync(stage, entityKey, options.MaxRetries, options.ForceRetry, ct))
                {
                    report.SkippedQuarantinedCount++;
                    checkpointCandidate = rowCursor;

                    continue;
                }

                report.ProcessedCount++;

                try
                {
                    ScopeContext scope = new()
                    {
                        TenantId = row.TenantId, WorkspaceId = row.WorkspaceId, ProjectId = row.ProjectId
                    };

                    ManifestDocument? manifest = await goldenManifestRepository.GetByIdAsync(scope, row.ManifestId, ct);

                    if (manifest is null)
                    {
                        report.SuccessCount++;
                        checkpointCandidate = rowCursor;

                        continue;
                    }

                    await using Microsoft.Data.SqlClient.SqlConnection conn =
                        await connectionFactory.CreateOpenConnectionAsync(ct);
                    await using Microsoft.Data.SqlClient.SqlTransaction tx = conn.BeginTransaction();

                    await SqlGoldenManifestRepository.BackfillPhase1RelationalSlicesAsync(manifest, conn, tx, ct);
                    tx.Commit();
                    report.SuccessCount++;
                    await _quarantine.ClearAsync(stage, entityKey, ct);
                    checkpointCandidate = rowCursor;
                    logger.LogInformation("Backfill GoldenManifests: completed {ManifestId}", row.ManifestId);
                }
                catch (Exception ex) when (!ct.IsCancellationRequested)
                {
                    report.FailureCount++;
                    report.Failures.Add(
                        new SqlRelationalBackfillFailure
                        {
                            Stage = stage, EntityKey = entityKey, Message = ex.Message
                        });

                    await _quarantine.RecordFailureAsync(stage, entityKey, ex.Message, options.MaxRetries, ct);
                    logger.LogError(ex, "Backfill GoldenManifests: failed {ManifestId}", row.ManifestId);
                    stopPage = true;

                    break;
                }
            }

            cursor = checkpointCandidate;
            await _checkpoints.SaveCursorAsync(stage, cursor, ct);

            if (stopPage || page.Count < options.BatchSize)
                break;
        }
    }
}
