using System.Text;
using System.Text.Json;

using ArchLucid.Core.Configuration;

using Azure.Storage.Blobs;

using Microsoft.Extensions.Options;

namespace ArchLucid.Host.Core.Hosted;

/// <summary>
///     Archives <c>dbo.FirstTenantFunnelEvents</c> rows older than the configured retention window to Azure Blob
///     Storage (JSON lines), then deletes them from SQL after a successful upload.
/// </summary>
public sealed class FirstTenantFunnelArchivalHostedService(
    IServiceScopeFactory scopeFactory,
    IOptionsMonitor<FirstTenantFunnelOptions> funnelOptions,
    ILogger<FirstTenantFunnelArchivalHostedService> logger,
    HostLeaderElectionCoordinator electionCoordinator) : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory =
        scopeFactory ?? throw new ArgumentNullException(nameof(scopeFactory));

    private readonly IOptionsMonitor<FirstTenantFunnelOptions> _funnelOptions =
        funnelOptions ?? throw new ArgumentNullException(nameof(funnelOptions));

    private readonly ILogger<FirstTenantFunnelArchivalHostedService> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    private readonly HostLeaderElectionCoordinator _electionCoordinator =
        electionCoordinator ?? throw new ArgumentNullException(nameof(electionCoordinator));

    protected override Task ExecuteAsync(CancellationToken stoppingToken)
    {
        return _electionCoordinator.RunLeaderWorkAsync(
            HostElectionLeaseNames.FirstTenantFunnelArchival,
            RunLoopAsync,
            stoppingToken);
    }

    private async Task RunLoopAsync(CancellationToken leaderToken)
    {
        while (!leaderToken.IsCancellationRequested)
        {
            FirstTenantFunnelOptions opts = _funnelOptions.CurrentValue;
            int intervalHours = opts.ArchivalIntervalHours > 0 ? opts.ArchivalIntervalHours : 24;
            TimeSpan delay = TimeSpan.FromHours(intervalHours);

            try
            {
                await RunArchivalCycleOnceAsync(opts, leaderToken).ConfigureAwait(false);
            }
            catch (OperationCanceledException) when (leaderToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "FirstTenantFunnel archival cycle failed.");
            }

            try
            {
                await Task.Delay(delay, leaderToken).ConfigureAwait(false);
            }
            catch (OperationCanceledException) when (leaderToken.IsCancellationRequested)
            {
                break;
            }
        }
    }

    private async Task RunArchivalCycleOnceAsync(FirstTenantFunnelOptions opts, CancellationToken ct)
    {
        if (!opts.PerTenantEmission)
        {
            if (_logger.IsEnabled(LogLevel.Debug))

                _logger.LogDebug(
                    "FirstTenantFunnel archival skipped: Telemetry:FirstTenantFunnel:PerTenantEmission is false.");

            return;
        }

        using IServiceScope scope = _scopeFactory.CreateScope();
        BlobServiceClient? blobClient = scope.ServiceProvider.GetService<BlobServiceClient>();

        if (blobClient is null)
        {
            _logger.LogWarning(
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
            if (_logger.IsEnabled(LogLevel.Debug))

                _logger.LogDebug("FirstTenantFunnel archival: no rows older than {RetentionDays} days.", retentionDays);

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
        DateTime stamp = DateTime.UtcNow;
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
            _logger.LogError(ex, "FirstTenantFunnel archival blob upload failed for batch {Min}-{Max}.", minId, maxId);

            return;
        }

        IReadOnlyList<long> ids = rows.Select(static r => r.EventId).ToList();

        await store.DeleteByEventIdsAsync(ids, ct).ConfigureAwait(false);

        _logger.LogInformation(
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
