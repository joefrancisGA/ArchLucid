using System.Diagnostics;

using ArchLucid.Core.Concurrency;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Integration;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

using Serilog.Context;

namespace ArchLucid.Persistence.IntegrationOutbox;

/// <inheritdoc cref="IIntegrationEventOutboxProcessor" />
public sealed class IntegrationEventOutboxProcessor(
    IServiceScopeFactory scopeFactory,
    IOptions<IntegrationEventsOptions> integrationEventsOptions,
    ILogger<IntegrationEventOutboxProcessor> logger) : IIntegrationEventOutboxProcessor
{
    private const int MaxBatch = 25;

    private readonly IServiceScopeFactory _scopeFactory =
        scopeFactory ?? throw new ArgumentNullException(nameof(scopeFactory));

    private readonly IOptions<IntegrationEventsOptions> _integrationEventsOptions =
        integrationEventsOptions ?? throw new ArgumentNullException(nameof(integrationEventsOptions));

    private readonly ILogger<IntegrationEventOutboxProcessor> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    /// <inheritdoc />
    public async Task<int> ProcessPendingBatchAsync(CancellationToken ct)
    {
        using IServiceScope dequeueScope = _scopeFactory.CreateScope();
        IIntegrationEventOutboxRepository outbox =
            dequeueScope.ServiceProvider.GetRequiredService<IIntegrationEventOutboxRepository>();

        IntegrationEventsOptions opts = _integrationEventsOptions.Value;
        int maxAttempts = Math.Clamp(opts.OutboxMaxPublishAttempts, 1, 100);
        int maxBackoffSeconds = Math.Clamp(opts.OutboxMaxBackoffSeconds, 1, 86_400);
        int maxConcurrent = Math.Clamp(opts.OutboxMaxConcurrentBatchEntries, 1, MaxBatch);

        IReadOnlyList<IntegrationEventOutboxEntry> batch = await outbox.DequeuePendingAsync(MaxBatch, ct)
            .ConfigureAwait(false);

        await BoundedBatchParallelism.ForEachAsync(
            batch,
            maxConcurrent,
            (entry, token) => ProcessEntryAsync(entry, maxAttempts, maxBackoffSeconds, token),
            ct).ConfigureAwait(false);

        return batch.Count;
    }

    private async Task ProcessEntryAsync(
        IntegrationEventOutboxEntry entry,
        int maxAttempts,
        int maxBackoffSeconds,
        CancellationToken ct)
    {
        using IServiceScope scope = _scopeFactory.CreateScope();
        IIntegrationEventOutboxRepository outbox =
            scope.ServiceProvider.GetRequiredService<IIntegrationEventOutboxRepository>();
        IIntegrationEventPublisher publisher =
            scope.ServiceProvider.GetRequiredService<IIntegrationEventPublisher>();

        using Activity? activity = ArchLucidInstrumentation.IntegrationEventOutbox.StartActivity(
            "IntegrationEventOutbox.ProcessEntry");
        string correlationId = entry.RunId.HasValue
            ? FormattableString.Invariant($"run:{entry.RunId.Value:D}")
            : FormattableString.Invariant($"integration-outbox:{entry.OutboxId:D}");
        activity?.SetTag(ActivityCorrelation.LogicalCorrelationIdTag, correlationId);
        activity?.SetTag("archlucid.outbox_id", entry.OutboxId.ToString("D"));
        activity?.SetTag("archlucid.event_type", entry.EventType);

        if (entry.RunId.HasValue)

            activity?.SetTag("archlucid.run_id", entry.RunId.Value.ToString("D"));


        using IDisposable _ = LogContext.PushProperty("CorrelationId", correlationId);

        try
        {
            IReadOnlyDictionary<string, object>? applicationProperties =
                IntegrationEventServiceBusApplicationProperties.TryResolveForPublish(
                    entry.EventType,
                    entry.PayloadUtf8);

            await publisher.PublishAsync(
                entry.EventType,
                entry.PayloadUtf8,
                entry.MessageId,
                applicationProperties,
                ct).ConfigureAwait(false);

            await outbox.MarkProcessedAsync(entry.OutboxId, ct).ConfigureAwait(false);
            ArchLucidInstrumentation.RecordIntegrationEventDeliverySuccess(entry.EventType);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            ArchLucidInstrumentation.RecordIntegrationEventDeliveryFailure(entry.EventType);

            int newRetryCount = entry.RetryCount + 1;
            string err = ex.Message;

            if (err.Length > 2048)

                err = err[..2048];


            if (newRetryCount >= maxAttempts)
            {
                await outbox.RecordPublishFailureAsync(
                    entry.OutboxId,
                    newRetryCount,
                    nextRetryUtc: null,
                    deadLetteredUtc: TimeProvider.System.UtcNowDateTime(),
                    lastErrorMessage: err,
                    ct).ConfigureAwait(false);

                _logger.LogError(
                    ex,
                    "Integration event outbox dead-lettered after {RetryCount} failures (outbox {OutboxId}, event {EventType}).",
                    newRetryCount,
                    entry.OutboxId,
                    entry.EventType);
            }
            else
            {
                TimeSpan delay = IntegrationEventOutboxRetryCalculator.DelayUntilNextAttempt(newRetryCount, maxBackoffSeconds);
                DateTime nextUtc = TimeProvider.System.UtcNowDateTime().Add(delay);

                await outbox.RecordPublishFailureAsync(
                    entry.OutboxId,
                    newRetryCount,
                    nextRetryUtc: nextUtc,
                    deadLetteredUtc: null,
                    lastErrorMessage: err,
                    ct).ConfigureAwait(false);

                _logger.LogWarning(
                    ex,
                    "Integration event outbox publish failed (attempt {RetryCount}/{Max}); next retry after {NextRetryUtc} (outbox {OutboxId}, event {EventType}).",
                    newRetryCount,
                    maxAttempts,
                    nextUtc,
                    entry.OutboxId,
                    entry.EventType);
            }
        }
    }
}
