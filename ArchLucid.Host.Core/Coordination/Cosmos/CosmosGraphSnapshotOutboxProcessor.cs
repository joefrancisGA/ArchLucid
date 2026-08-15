using System.Diagnostics;

using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Scoping;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.Coordination;
using ArchLucid.Persistence.Cosmos;
using ArchLucid.Persistence.Repositories;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

using Serilog.Context;

namespace ArchLucid.Host.Core.Coordination.Cosmos;

/// <inheritdoc cref="ICosmosGraphSnapshotOutboxProcessor" />
public sealed class CosmosGraphSnapshotOutboxProcessor(
    IServiceScopeFactory scopeFactory,
    IOptions<CosmosGraphSnapshotOutboxProcessorOptions> processorOptions,
    TimeProvider timeProvider,
    ILogger<CosmosGraphSnapshotOutboxProcessor> logger)
    : RecoverableOutboxProcessorBase<
            CosmosGraphSnapshotOutboxEntry,
            ICosmosGraphSnapshotOutboxRepository,
            CosmosGraphSnapshotOutboxProcessorOptions>(
        scopeFactory,
        processorOptions,
        timeProvider,
        logger),
        ICosmosGraphSnapshotOutboxProcessor
{
    protected override bool UsesParallelBatchProcessing(CosmosGraphSnapshotOutboxProcessorOptions opts) => false;

    protected override void LogProcessingFailure(Exception fault, CosmosGraphSnapshotOutboxEntry entry)
    {
        if (Logger.IsEnabled(LogLevel.Warning))
        {
            Logger.LogWarning(
                fault,
                "Cosmos graph snapshot outbox processing failed for outbox {OutboxId}, graph {GraphSnapshotId}.",
                entry.OutboxId,
                entry.GraphSnapshotId);
        }
    }

    protected override async Task ProcessEntryAsync(
        IServiceScope scope,
        ICosmosGraphSnapshotOutboxRepository outbox,
        CosmosGraphSnapshotOutboxEntry entry,
        CosmosGraphSnapshotOutboxProcessorOptions opts,
        CancellationToken cancellationToken)
    {
        SqlGraphSnapshotRepository sqlGraphSnapshots =
            scope.ServiceProvider.GetRequiredService<SqlGraphSnapshotRepository>();
        CosmosGraphSnapshotRepository cosmosGraphSnapshots =
            scope.ServiceProvider.GetRequiredService<CosmosGraphSnapshotRepository>();

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
            await sqlGraphSnapshots.GetByIdAsync(scopeContext, entry.GraphSnapshotId, cancellationToken);

        if (snapshot is null)
        {
            throw new InvalidOperationException(
                $"Graph snapshot '{entry.GraphSnapshotId:D}' was not found in SQL for Cosmos replication.");
        }

        await cosmosGraphSnapshots.SaveAsync(snapshot, cancellationToken);
        await outbox.MarkProcessedAsync(entry.OutboxId, cancellationToken);
    }

    protected override CosmosGraphSnapshotOutboxProcessorOptions VerifyOptions(
        CosmosGraphSnapshotOutboxProcessorOptions configured)
    {
        ArgumentNullException.ThrowIfNull(configured);

        if (configured.LeaseDurationSeconds < 60)
            configured.LeaseDurationSeconds = 60;

        return configured;
    }
}
