using System.Diagnostics;

using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Scoping;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Persistence.Cosmos;
using ArchLucid.Persistence.Orchestration;
using ArchLucid.Persistence.Repositories;

using Microsoft.Extensions.Options;

using Serilog.Context;

namespace ArchLucid.Host.Core.Coordination.Cosmos;

/// <inheritdoc cref="ICosmosGraphSnapshotOutboxProcessor" />
public sealed class CosmosGraphSnapshotOutboxProcessor(
    IServiceScopeFactory scopeFactory,
    IOptions<CosmosGraphSnapshotOutboxProcessorOptions> processorOptions,
    TimeProvider timeProvider,
    ILogger<CosmosGraphSnapshotOutboxProcessor> logger) : ICosmosGraphSnapshotOutboxProcessor
{
    private const int MaxBatch = 25;

    private readonly ILogger<CosmosGraphSnapshotOutboxProcessor> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    private readonly IOptions<CosmosGraphSnapshotOutboxProcessorOptions> _processorOptions =
        processorOptions ?? throw new ArgumentNullException(nameof(processorOptions));

    private readonly IServiceScopeFactory _scopeFactory =
        scopeFactory ?? throw new ArgumentNullException(nameof(scopeFactory));

    private readonly TimeProvider _timeProvider =
        timeProvider ?? throw new ArgumentNullException(nameof(timeProvider));

    /// <inheritdoc />
    public async Task ProcessPendingBatchAsync(CancellationToken ct)
    {
        CosmosGraphSnapshotOutboxProcessorOptions opts = VerifiedOptions(_processorOptions.Value);

        using IServiceScope scope = _scopeFactory.CreateScope();
        ICosmosGraphSnapshotOutboxRepository outbox =
            scope.ServiceProvider.GetRequiredService<ICosmosGraphSnapshotOutboxRepository>();
        SqlGraphSnapshotRepository sqlGraphSnapshots =
            scope.ServiceProvider.GetRequiredService<SqlGraphSnapshotRepository>();
        CosmosGraphSnapshotRepository cosmosGraphSnapshots =
            scope.ServiceProvider.GetRequiredService<CosmosGraphSnapshotRepository>();

        IReadOnlyList<CosmosGraphSnapshotOutboxEntry> batch =
            await outbox.DequeuePendingAsync(MaxBatch, opts.LeaseDurationSeconds, ct);

        foreach (CosmosGraphSnapshotOutboxEntry entry in batch)

            try
            {
                await ProcessEntryAsync(outbox, sqlGraphSnapshots, cosmosGraphSnapshots, entry, ct);
            }
            catch (OperationCanceledException)
            {
                throw;
            }
            catch (Exception ex)
            {
                await OnProcessingFailedAsync(outbox, entry, ex, opts, ct);
            }
    }

    private async Task ProcessEntryAsync(
        ICosmosGraphSnapshotOutboxRepository outbox,
        SqlGraphSnapshotRepository sqlGraphSnapshots,
        CosmosGraphSnapshotRepository cosmosGraphSnapshots,
        CosmosGraphSnapshotOutboxEntry entry,
        CancellationToken ct)
    {
        using Activity? activity = ArchLucidInstrumentation.AuthorityRun.StartActivity(
            "CosmosGraphSnapshotOutbox.ProcessEntry");
        string correlationId = FormattableString.Invariant($"cosmos-graph-outbox:{entry.OutboxId:D}");
        activity?.SetTag(ActivityCorrelation.LogicalCorrelationIdTag, correlationId);
        activity?.SetTag("archlucid.graph_snapshot_id", entry.GraphSnapshotId.ToString("D"));

        using IDisposable _ = LogContext.PushProperty("CorrelationId", correlationId);

        ScopeContext scopeContext = new()
        {
            TenantId = entry.TenantId,
            WorkspaceId = entry.WorkspaceId,
            ProjectId = entry.ProjectId
        };

        GraphSnapshot? snapshot =
            await sqlGraphSnapshots.GetByIdAsync(scopeContext, entry.GraphSnapshotId, ct);

        if (snapshot is null)
            throw new InvalidOperationException(
                $"Graph snapshot '{entry.GraphSnapshotId:D}' was not found in SQL for Cosmos replication.");

        await cosmosGraphSnapshots.SaveAsync(snapshot, ct);
        await outbox.MarkProcessedAsync(entry.OutboxId, ct);
    }

    private async Task OnProcessingFailedAsync(
        ICosmosGraphSnapshotOutboxRepository outbox,
        CosmosGraphSnapshotOutboxEntry entry,
        Exception fault,
        CosmosGraphSnapshotOutboxProcessorOptions opts,
        CancellationToken ct)
    {
        if (_logger.IsEnabled(LogLevel.Warning))

            _logger.LogWarning(
                fault,
                "Cosmos graph snapshot outbox processing failed for outbox {OutboxId}, graph {GraphSnapshotId}.",
                entry.OutboxId,
                entry.GraphSnapshotId);

        string summary = AuthorityPipelineWorkErrorSummary.From(fault);

        if (RetriesExhaustedAfterThisFailure(entry, opts))
        {
            await outbox.RecordDeadLetterAsync(entry.OutboxId, summary, ct);
            return;
        }

        DateTime nextAttemptUtc = _timeProvider.UtcNowDateTime().Add(RetryDelayAfterFailure(entry, opts));
        await outbox.RecordBackoffAfterProcessingFailureAsync(entry.OutboxId, nextAttemptUtc, summary, ct);
    }

    private static bool RetriesExhaustedAfterThisFailure(
        CosmosGraphSnapshotOutboxEntry entry,
        CosmosGraphSnapshotOutboxProcessorOptions opts)
    {
        int max = opts.MaxAttemptsBeforeDeadLetter <= 1 ? 1 : opts.MaxAttemptsBeforeDeadLetter;
        long attemptAfterPersist = entry.AttemptCount + 1L;

        return attemptAfterPersist >= max;
    }

    private static TimeSpan RetryDelayAfterFailure(
        CosmosGraphSnapshotOutboxEntry entry,
        CosmosGraphSnapshotOutboxProcessorOptions opts)
    {
        int floor = opts.RetryBackoffBaseSeconds < 1 ? 1 : opts.RetryBackoffBaseSeconds;
        int cap = opts.RetryBackoffMaxSeconds < floor ? floor : opts.RetryBackoffMaxSeconds;
        double scaled = floor * Math.Pow(2, entry.AttemptCount);
        double clamped = scaled > cap ? cap : scaled;
        double secondsRounded = clamped <= 1 ? 1 : Math.Ceiling(clamped);

        return TimeSpan.FromSeconds(secondsRounded);
    }

    private static CosmosGraphSnapshotOutboxProcessorOptions VerifiedOptions(
        CosmosGraphSnapshotOutboxProcessorOptions configured)
    {
        ArgumentNullException.ThrowIfNull(configured);

        if (configured.LeaseDurationSeconds < 60)
            configured.LeaseDurationSeconds = 60;

        return configured;
    }
}
