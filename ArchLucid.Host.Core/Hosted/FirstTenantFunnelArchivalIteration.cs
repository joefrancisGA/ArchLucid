using System.Text;
using System.Text.Json;

using ArchLucid.Core.Configuration;

using ArchLucid.Persistence.Telemetry;

using Azure.Storage.Blobs;

namespace ArchLucid.Host.Core.Hosted;

/// <summary>One archival cycle (extracted for <see cref="FirstTenantFunnelArchivalHostedService"/> and CLI job).</summary>
public static class FirstTenantFunnelArchivalIteration
{
    /// <summary>
    /// When <paramref name="opts"/>.<see cref="FirstTenantFunnelOptions.PerTenantEmission"/> is true, uploads a batch of aged
    /// rows to blob and deletes them from SQL after a successful upload.
    /// </summary>
    public static async Task RunOnceAsync(
        IServiceScopeFactory scopeFactory,
        FirstTenantFunnelOptions opts,
        ILogger logger,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scopeFactory);
        ArgumentNullException.ThrowIfNull(opts);
        ArgumentNullException.ThrowIfNull(logger);

        if (!opts.PerTenantEmission)
        {
            if (logger.IsEnabled(LogLevel.Debug))

                logger.LogDebug(
                    "FirstTenantFunnel archival skipped: Telemetry:FirstTenantFunnel:PerTenantEmission is false.");

            return;
        }

        using IServiceScope scope = scopeFactory.CreateScope();
        BlobServiceClient? blobClient = scope.ServiceProvider.GetService<BlobServiceClient>();

        if (blobClient is null)
        {
            logger.LogWarning(
                "FirstTenantFunnel archival skipped: BlobServiceClient is not registered (blob storage disabled?).");

            return;
        }

        IFirstTenantFunnelArchivalBatchStore store =
            scope.ServiceProvider.GetRequiredService<IFirstTenantFunnelArchivalBatchStore>();

        int retentionDays = opts.ArchivalRetentionDays > 0 ? opts.ArchivalRetentionDays : 90;
        int batchSize = opts.ArchivalBatchSize > 0 ? opts.ArchivalBatchSize : 1000;

        IReadOnlyList<FirstTenantFunnelArchiveRow> rows =
            await store.TakeRowsOlderThanAsync(retentionDays, batchSize, ct).ConfigureAwait(false);

        if (rows.Count == 0)
        {
            if (logger.IsEnabled(LogLevel.Debug))

                logger.LogDebug("FirstTenantFunnel archival: no rows older than {RetentionDays} days.", retentionDays);

            return;
        }

        string containerName = string.IsNullOrWhiteSpace(opts.ArchivalBlobContainerName)
            ? "funnel-archive"
            : opts.ArchivalBlobContainerName.Trim();

        BlobContainerClient container = blobClient.GetBlobContainerClient(containerName.ToLowerInvariant());
        await container.CreateIfNotExistsAsync(cancellationToken: ct).ConfigureAwait(false);

        string jsonl = BuildJsonLines(rows);
        long minId = rows[0].EventId;
        long maxId = rows[^1].EventId;
        DateTime stamp = TimeProvider.System.UtcNowDateTime();
        string blobName =
            $"funnel-archive/{stamp:yyyy}/{stamp:MM}/{stamp:dd}/batch-{minId}-{maxId}.jsonl";

        BlobClient blob = container.GetBlobClient(blobName);

        try
        {
            await blob.UploadAsync(
                    BinaryData.FromString(jsonl),
                    overwrite: true,
                    cancellationToken: ct)
                .ConfigureAwait(false);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "FirstTenantFunnel archival blob upload failed for batch {Min}-{Max}.", minId, maxId);

            return;
        }

        IReadOnlyList<long> ids = rows.Select(static r => r.EventId).ToList();

        await store.DeleteByEventIdsAsync(ids, ct).ConfigureAwait(false);

        logger.LogInformation(
            "FirstTenantFunnel archival uploaded {Count} rows to {BlobUrl} and deleted from SQL.",
            rows.Count,
            blob.Uri);
    }

    private static string BuildJsonLines(IReadOnlyList<FirstTenantFunnelArchiveRow> rows)
    {
        StringBuilder sb = new(capacity: rows.Count * 120);

        foreach (FirstTenantFunnelArchiveRow row in rows)
            sb.AppendLine(JsonSerializer.Serialize(row));

        return sb.ToString();
    }
}
