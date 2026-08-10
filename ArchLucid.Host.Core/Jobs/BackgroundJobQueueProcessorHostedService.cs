using ArchLucid.Application.Jobs;
using ArchLucid.Application.Operations;
using ArchLucid.Core.Concurrency;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.Hosted;
using ArchLucid.Persistence.Data.Repositories;

using Azure.Storage.Queues;
using Azure.Storage.Queues.Models;

using Microsoft.Extensions.Options;

namespace ArchLucid.Host.Core.Jobs;

/// <summary>Worker-side loop: receives job ids from Azure Storage Queue, executes exports, stores results in blob.</summary>
public sealed class BackgroundJobQueueProcessorHostedService(
    ILogger<BackgroundJobQueueProcessorHostedService> logger,
    QueueClient queueClient,
    IBackgroundJobRepository repository,
    IServiceScopeFactory scopeFactory,
    IOperationCancellationRegistry operationCancellationRegistry,
    IOptions<BackgroundJobsOptions> options) : BackgroundService, IAsyncDisposable
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        BackgroundJobsOptions snapshot = options.Value;
        TimeSpan visibility = TimeSpan.FromMinutes(Math.Clamp(snapshot.ProcessorVisibilityMinutes, 1, 120));
        int baseIdleMs = Math.Clamp(snapshot.ProcessorIdlePollMilliseconds, 100, 60_000);
        int maxIdleMs = ResolveMaxIdlePollMilliseconds(snapshot.ProcessorMaxIdlePollMilliseconds, baseIdleMs);
        int batchSize = Math.Clamp(snapshot.ProcessorReceiveBatchSize, 1, 32);
        int maxConcurrentJobs = Math.Clamp(snapshot.ProcessorMaxConcurrentJobs, 1, 16);
        AdaptiveOutboxIdleBackoff idleBackoff = new(
            TimeSpan.FromMilliseconds(baseIdleMs),
            TimeSpan.FromMilliseconds(maxIdleMs));

        await queueClient.CreateIfNotExistsAsync(cancellationToken: stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                QueueMessage[] messages = await queueClient.ReceiveMessagesAsync(
                    maxMessages: batchSize,
                    visibilityTimeout: visibility,
                    cancellationToken: stoppingToken);

                TimeSpan idleDelay = idleBackoff.NextDelay(messages.Length);

                if (messages.Length == 0)
                {
                    await Task.Delay(idleDelay, stoppingToken);

                    continue;
                }

                // Jobs are independent (own DI scope, own queue message), so a bounded fan-out
                // multiplies single-replica throughput without exhausting the SQL pool (TB-586 pattern).
                await BoundedBatchParallelism.ForEachAsync(
                    messages,
                    maxConcurrentJobs,
                    async (message, ct) =>
                    {
                        string? jobId = message.MessageText?.Trim();

                        if (string.IsNullOrWhiteSpace(jobId))
                        {
                            await queueClient.DeleteMessageAsync(message.MessageId, message.PopReceipt, ct);

                            return;
                        }

                        await ProcessOneMessageAsync(jobId, message, ct);
                    },
                    stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Background job queue processor loop failed; backing off.");
                TimeSpan faultDelay = idleBackoff.NextDelay(dequeuedCount: 0);
                await Task.Delay(faultDelay, stoppingToken);
            }
        }
    }

    /// <summary>Clamps optional max idle to at least the base idle and at most 60 s.</summary>
    internal static int ResolveMaxIdlePollMilliseconds(int? configuredMaxIdleMs, int baseIdleMs)
    {
        int defaultMaxMs = (int)AdaptiveOutboxIdleBackoff.MaxIdleDelay.TotalMilliseconds;

        if (configuredMaxIdleMs is null)
            return Math.Max(baseIdleMs, defaultMaxMs);

        return Math.Clamp(configuredMaxIdleMs.Value, baseIdleMs, 60_000);
    }

    private async Task ProcessOneMessageAsync(string jobId, QueueMessage message, CancellationToken stoppingToken)
    {
        QueuedBackgroundJobPrepareResult prepared =
            await repository.TryPrepareQueuedJobAsync(jobId, stoppingToken);

        if (prepared.ShouldDeleteQueueMessageImmediately)
        {
            if (prepared.WasUnknownJobId)

                logger.LogWarning("Queue message for unknown job id {JobId}; deleting stale message.", LogSanitizer.Sanitize(jobId));

            else if (logger.IsEnabled(LogLevel.Debug))

                logger.LogDebug(
                    "Queue message for job {JobId} resolved without execution; deleting notification.",
                    LogSanitizer.Sanitize(jobId));

            await queueClient.DeleteMessageAsync(message.MessageId, message.PopReceipt, stoppingToken);

            return;
        }

        if (!prepared.ShouldRunExecutor || prepared.RowWhenRunnable is null)
        {
            if (logger.IsEnabled(LogLevel.Debug))

                logger.LogDebug(
                    "Job {JobId} not claimable in this poll; leaving message for visibility retry.",
                    LogSanitizer.Sanitize(jobId));

            return;
        }

        BackgroundJobRow row = prepared.RowWhenRunnable;

        BackgroundJobWorkUnit? workUnit = BackgroundJobWorkUnitJson.Deserialize(row.WorkUnitJson);

        if (workUnit is null)
        {
            logger.LogError("Job {JobId} has invalid WorkUnitJson; failing permanently.", LogSanitizer.Sanitize(jobId));
            await repository.MarkFailedTerminalAsync(jobId, "Invalid job payload.", row.RetryCount + 1, stoppingToken);
            await queueClient.DeleteMessageAsync(message.MessageId, message.PopReceipt, stoppingToken);

            return;
        }

        if (operationCancellationRegistry.IsCancelRequestedAnyScope(OperationIdCodec.ForJob(jobId)))
        {
            await repository.MarkCanceledAsync(jobId, stoppingToken);
            await queueClient.DeleteMessageAsync(message.MessageId, message.PopReceipt, stoppingToken);

            return;
        }

        try
        {
            await using AsyncServiceScope scope = scopeFactory.CreateAsyncScope();
            IBackgroundJobWorkUnitExecutor executor = scope.ServiceProvider.GetRequiredService<IBackgroundJobWorkUnitExecutor>();
            IBackgroundJobResultBlobAccessor blobs = scope.ServiceProvider.GetRequiredService<IBackgroundJobResultBlobAccessor>();

            BackgroundJobFile file = await executor.ExecuteAsync(workUnit, stoppingToken);
            string blobName = await blobs.UploadAsync(jobId, file, stoppingToken);

            await repository.MarkSucceededAsync(jobId, blobName, file.FileName, file.ContentType, stoppingToken);
            await queueClient.DeleteMessageAsync(message.MessageId, message.PopReceipt, stoppingToken);
        }
        catch (Exception ex)
        {
            await HandleFailureAsync(jobId, row, ex, message, options.Value.MaxPendingJobs, stoppingToken);
        }
    }

    private async Task HandleFailureAsync(
        string jobId,
        BackgroundJobRow row,
        Exception ex,
        QueueMessage message,
        int maxPendingJobs,
        CancellationToken stoppingToken)
    {
        int nextRetry = row.RetryCount + 1;

        if (nextRetry <= row.MaxRetries)
        {
            logger.LogWarning(
                ex,
                "Background job {JobId} failed (attempt {Attempt}/{Max}); scheduling retry.",
                LogSanitizer.Sanitize(jobId),
                nextRetry,
                row.MaxRetries);

            await repository.MarkPendingRetryAsync(jobId, nextRetry, ex.Message, stoppingToken);

            int baseDelayMs = (int)Math.Min(1000 * Math.Pow(2, nextRetry - 1), 30_000);
            int jitterSpan = baseDelayMs * 20 / 100;
            int delayMs = baseDelayMs + Random.Shared.Next(-jitterSpan, jitterSpan + 1);
            await Task.Delay(delayMs, stoppingToken);

            int pending = await repository.CountNonTerminalAsync(stoppingToken);

            if (pending >= maxPendingJobs)
            {
                logger.LogError(
                    "Background job {JobId} could not be re-queued; non-terminal capacity exhausted.",
                    LogSanitizer.Sanitize(jobId));

                await repository.MarkFailedTerminalAsync(
                    jobId,
                    "Retry skipped: job queue at capacity.",
                    nextRetry,
                    stoppingToken);

                await queueClient.DeleteMessageAsync(message.MessageId, message.PopReceipt, stoppingToken);

                return;
            }

            await queueClient.SendMessageAsync(jobId, stoppingToken);
            await queueClient.DeleteMessageAsync(message.MessageId, message.PopReceipt, stoppingToken);

            return;
        }

        logger.LogError(
            ex,
            "Background job {JobId} failed after {Attempts} attempt(s).",
            LogSanitizer.Sanitize(jobId),
            nextRetry);

        await repository.MarkFailedTerminalAsync(jobId, ex.Message, nextRetry, stoppingToken);
        await queueClient.DeleteMessageAsync(message.MessageId, message.PopReceipt, stoppingToken);
    }

    public async ValueTask DisposeAsync()
    {
        await base.StopAsync(CancellationToken.None);
        base.Dispose();
    }
}
