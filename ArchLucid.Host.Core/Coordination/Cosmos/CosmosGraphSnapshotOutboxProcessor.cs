using System.Diagnostics;

using ArchLucid.Application.Coordination;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Runs;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.Coordination;
using ArchLucid.Persistence.Cosmos;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Queries;

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

        ActivityScopeTags.ApplyTenantWorkspace(activity, scopeContext);

        if (!CommittedRunEvidenceBinding.HasExplicitScope(scopeContext) ||
            !CommittedRunEvidenceBinding.MatchesDrainScope(scopeContext, AmbientScopeContext.CurrentOverride) ||
            entry.RunId == Guid.Empty || entry.GraphSnapshotId == Guid.Empty)
        {
            await SkipEntryAsync(outbox, entry, "outbox scope or resource binding is invalid", cancellationToken)
                .ConfigureAwait(false);
            return;
        }

        using IDisposable ambientScope = AmbientScopeContext.Push(scopeContext);

        IRunRepository runs = scope.ServiceProvider.GetRequiredService<IRunRepository>();
        RunRecord? run = await runs.GetByIdIncludingArchivedAsync(scopeContext, entry.RunId, cancellationToken)
            .ConfigureAwait(false);
        if (run is null || !CommittedRunEvidenceBinding.MatchesActiveRun(scopeContext, entry.RunId, run))
        {
            await SkipEntryAsync(outbox, entry, "no matching active run", cancellationToken).ConfigureAwait(false);
            return;
        }

        AuthorityRunLifecyclePhase phase = AuthorityRunLifecyclePhaseListResolver.ResolveFromRunHeader(run);
        if (phase == AuthorityRunLifecyclePhase.Failed)
        {
            await SkipEntryAsync(outbox, entry, "run did not commit successfully", cancellationToken).ConfigureAwait(false);
            return;
        }

        // The graph producer can publish an outbox row before the authority run is committed.
        // A legitimate early row should wait without reading a payload or consuming its failure budget.
        if (phase != AuthorityRunLifecyclePhase.Complete || run.GoldenManifestId is not Guid manifestId)
        {
            await DeferForFinalizationAsync(outbox, entry, opts, cancellationToken).ConfigureAwait(false);
            return;
        }

        if (run.GraphSnapshotId != entry.GraphSnapshotId)
        {
            await SkipEntryAsync(outbox, entry, "queued graph is not the committed run's graph", cancellationToken)
                .ConfigureAwait(false);
            return;
        }

        IAuthorityQueryService authorityQuery = scope.ServiceProvider.GetRequiredService<IAuthorityQueryService>();
        ManifestDocument? manifest = await authorityQuery
            .GetManifestForSummaryVerificationAsync(scopeContext, manifestId, cancellationToken)
            .ConfigureAwait(false);
        if (manifest is null)
        {
            await DeferForFinalizationAsync(outbox, entry, opts, cancellationToken).ConfigureAwait(false);
            return;
        }
        if (!CommittedRunEvidenceBinding.MatchesManifest(scopeContext, run, manifest))
        {
            await SkipEntryAsync(outbox, entry, "manifest is not bound to the committed run and graph", cancellationToken)
                .ConfigureAwait(false);
            return;
        }

        CosmosGraphSnapshotOutboxSealedManifestHashGuard.EnsureGoldenManifestSealedHashOrThrow(
            manifest, entry.RunId, scope.ServiceProvider.GetRequiredService<IManifestHashService>());

        ICosmosGraphSnapshotOutboxSqlLoader sqlLoader =
            scope.ServiceProvider.GetRequiredService<ICosmosGraphSnapshotOutboxSqlLoader>();
        GraphSnapshot? snapshot = await sqlLoader.LoadAsync(scopeContext, entry.GraphSnapshotId, cancellationToken)
            .ConfigureAwait(false);
        if (snapshot is null || snapshot.GraphSnapshotId != manifest.GraphSnapshotId ||
            snapshot.RunId != manifest.RunId || snapshot.ContextSnapshotId != manifest.ContextSnapshotId)
        {
            await SkipEntryAsync(outbox, entry, "SQL graph is missing or does not match the sealed anchors", cancellationToken)
                .ConfigureAwait(false);
            return;
        }

        ICosmosGraphSnapshotOutboxCosmosWriter cosmosWriter =
            scope.ServiceProvider.GetRequiredService<ICosmosGraphSnapshotOutboxCosmosWriter>();
        await cosmosWriter.SaveAsync(snapshot, cancellationToken).ConfigureAwait(false);
        await CompleteProcessedEntryAsync(outbox, entry, cancellationToken).ConfigureAwait(false);
    }

    private Task SkipEntryAsync(
        ICosmosGraphSnapshotOutboxRepository outbox, CosmosGraphSnapshotOutboxEntry entry, string reason, CancellationToken ct) =>
        CompleteProcessedEntryAsync(outbox, entry, ct, () =>
        {
            if (Logger.IsEnabled(LogLevel.Warning))
                Logger.LogWarning("Skipping Cosmos graph snapshot replication for graph {GraphSnapshotId}: {Reason}.",
                    entry.GraphSnapshotId, reason);
        });

    private Task DeferForFinalizationAsync(
        ICosmosGraphSnapshotOutboxRepository outbox,
        CosmosGraphSnapshotOutboxEntry entry,
        CosmosGraphSnapshotOutboxProcessorOptions opts,
        CancellationToken ct)
    {
        // SQL claims always carry the lease. Without one, do not change a row we cannot prove we still own.
        if (entry.LockedUntilUtc is not DateTime leaseUtc)
            return Task.CompletedTask;

        DateTime nextAttemptUtc = TimeProvider.GetUtcNow().UtcDateTime
            .AddSeconds(Math.Clamp(opts.PollIntervalSeconds, 5, 300));
        return outbox.DeferUntilAsync(entry.OutboxId, leaseUtc, nextAttemptUtc, ct);
    }

    private async Task CompleteProcessedEntryAsync(
        ICosmosGraphSnapshotOutboxRepository outbox,
        CosmosGraphSnapshotOutboxEntry entry,
        CancellationToken cancellationToken,
        Action? postMarkObservability = null)
    {
        await outbox.MarkProcessedAsync(entry.OutboxId, cancellationToken).ConfigureAwait(false);

        try
        {
            postMarkObservability?.Invoke();
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception)
        {
            // The outbox row is already marked processed; observability must not schedule a retry.
        }
    }

    protected override CosmosGraphSnapshotOutboxProcessorOptions VerifyOptions(
        CosmosGraphSnapshotOutboxProcessorOptions configured)
    {
        ArgumentNullException.ThrowIfNull(configured);

        (int leaseDurationSeconds, int maxAttempts, int retryBackoffBaseSeconds, int retryBackoffMaxSeconds, _) =
            OutboxProcessorOptionsVerifier.NormalizeParallelLeaseRetry(
                configured.LeaseDurationSeconds,
                configured.MaxAttemptsBeforeDeadLetter,
                configured.RetryBackoffBaseSeconds,
                configured.RetryBackoffMaxSeconds,
                maxConcurrentBatchEntries: 1,
                MaxBatchSize,
                minLeaseDurationSeconds: 60);

        return new CosmosGraphSnapshotOutboxProcessorOptions
        {
            LeaseDurationSeconds = leaseDurationSeconds,
            MaxAttemptsBeforeDeadLetter = maxAttempts,
            RetryBackoffBaseSeconds = retryBackoffBaseSeconds,
            RetryBackoffMaxSeconds = retryBackoffMaxSeconds,
            PollIntervalSeconds = configured.PollIntervalSeconds,
        };
    }
}
