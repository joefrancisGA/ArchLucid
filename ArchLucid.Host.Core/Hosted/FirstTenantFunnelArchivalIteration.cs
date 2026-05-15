using System.Text;
using System.Text.Json;

using ArchLucid.Core.Configuration;

using ArchLucid.Persistence.Telemetry;

using Azure.Storage.Blobs;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

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

        using IServiceScope scope = scopeFactory.CreateScope();

        if (!opts.PerTenantEmission)
        {
            await PurgeAgedSqlRowsAfterPerTenantDisabledAsync(scope, opts, logger, ct).ConfigureAwait(false);

            return;
        }

        BlobServiceClient? blobClient = scope.ServiceProvider.GetService<BlobServiceClient>();

        IFirstTenantFunnelArchivalBatchStore store =
            scope.ServiceProvider.GetRequiredService<IFirstTenantFunnelArchivalBatchStore>();

        IOptions<ArchLucidRetentionOptions>? retentionOpts =
            scope.ServiceProvider.GetService<IOptions<ArchLucidRetentionOptions>>();
        ArchLucidRetentionOptions retention = retentionOpts?.Value ?? new ArchLucidRetentionOptions();

        IConfiguration configuration = scope.ServiceProvider.GetRequiredService<IConfiguration>();

        int funnelRetentionDays = ResolveFunnelRetentionDays(configuration, retention, opts);

        int batchSize = opts.ArchivalBatchSize > 0 ? opts.ArchivalBatchSize : 1000;

        IReadOnlyList<FirstTenantFunnelArchiveRow> rows =
            await store.TakeRowsOlderThanAsync(funnelRetentionDays, batchSize, ct).ConfigureAwait(false);

        if (rows.Count == 0)
        {
            if (logger.IsEnabled(LogLevel.Debug))

                logger.LogDebug("FirstTenantFunnel archival: no rows older than {RetentionDays} days.", funnelRetentionDays);

            return;
        }

        if (blobClient is null)
        {
            if (!retention.FunnelEventsHardDeleteWithoutBlobArchive)
            {
                logger.LogWarning(
                    "FirstTenantFunnel archival skipped: BlobServiceClient is not registered (blob storage disabled?).");

                return;
            }

            IReadOnlyList<long> purgeIds = rows.Select(static r => r.EventId).ToList();

            await store.DeleteByEventIdsAsync(purgeIds, ct).ConfigureAwait(false);

            logger.LogWarning(
                "FirstTenantFunnel: deleted {Count} aged SQL rows without blob archival (ArchLucid:Retention:FunnelEventsHardDeleteWithoutBlobArchive=true; no BlobServiceClient).",
                rows.Count);

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

    /// <summary>
    ///     Removes aged SQL rows when per-tenant funnel emission is off (leftovers after owner flipped the flag, or legacy
    ///     pilots). Uses the same retention precedence as blob archival but always deletes from SQL (no cold archive).
    /// </summary>
    private static async Task PurgeAgedSqlRowsAfterPerTenantDisabledAsync(
        IServiceScope serviceScope,
        FirstTenantFunnelOptions opts,
        ILogger logger,
        CancellationToken ct)
    {
        IConfiguration configuration = serviceScope.ServiceProvider.GetRequiredService<IConfiguration>();

        IFirstTenantFunnelArchivalBatchStore store =
            serviceScope.ServiceProvider.GetRequiredService<IFirstTenantFunnelArchivalBatchStore>();

        IOptions<ArchLucidRetentionOptions>? retentionOpts =
            serviceScope.ServiceProvider.GetService<IOptions<ArchLucidRetentionOptions>>();
        ArchLucidRetentionOptions retention = retentionOpts?.Value ?? new ArchLucidRetentionOptions();

        int funnelRetentionDays = ResolveFunnelRetentionDays(configuration, retention, opts);

        int batchSize = opts.ArchivalBatchSize > 0 ? opts.ArchivalBatchSize : 1000;

        IReadOnlyList<FirstTenantFunnelArchiveRow> rows =
            await store.TakeRowsOlderThanAsync(funnelRetentionDays, batchSize, ct).ConfigureAwait(false);

        if (rows.Count == 0)
        {
            if (logger.IsEnabled(LogLevel.Debug))

                logger.LogDebug(
                    "FirstTenantFunnel SQL purge (PerTenantEmission=false): no rows older than {RetentionDays} days.",
                    funnelRetentionDays);

            return;
        }

        IReadOnlyList<long> purgeIds = rows.Select(static r => r.EventId).ToList();

        await store.DeleteByEventIdsAsync(purgeIds, ct).ConfigureAwait(false);

        logger.LogInformation(
            "FirstTenantFunnel SQL purge (PerTenantEmission=false): deleted {Count} rows older than {RetentionDays} days.",
            rows.Count,
            funnelRetentionDays);
    }

    private static int ResolveFunnelRetentionDays(
        IConfiguration configuration,
        ArchLucidRetentionOptions retention,
        FirstTenantFunnelOptions opts)
    {
        ArgumentNullException.ThrowIfNull(configuration);
        ArgumentNullException.ThrowIfNull(retention);
        ArgumentNullException.ThrowIfNull(opts);

        int explicitArchLucidDays = configuration.GetValue<int?>("ArchLucid:FirstTenantFunnelRetentionDays") ?? 0;

        if (explicitArchLucidDays > 0)
            return explicitArchLucidDays;

        if (retention.FunnelEventsDays > 0)
            return retention.FunnelEventsDays;

        if (opts.ArchivalRetentionDays > 0)
            return opts.ArchivalRetentionDays;

        return 90;
    }

    private static string BuildJsonLines(IReadOnlyList<FirstTenantFunnelArchiveRow> rows)
    {
        StringBuilder sb = new(capacity: rows.Count * 120);

        foreach (FirstTenantFunnelArchiveRow row in rows)
            sb.AppendLine(JsonSerializer.Serialize(row));

        return sb.ToString();
    }
}
