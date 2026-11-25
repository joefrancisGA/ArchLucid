using System.Diagnostics;

using ArchLucid.Application.Coordination;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Runs;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Models;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.Coordination;
using ArchLucid.Persistence.Coordination.Retrieval;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Queries;
using ArchLucid.Provenance;
using ArchLucid.Retrieval.Indexing;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

using Serilog.Context;

namespace ArchLucid.Host.Core.Coordination.Retrieval;

/// <inheritdoc cref="IRetrievalIndexingOutboxProcessor" />
public sealed class RetrievalIndexingOutboxProcessor(
    IServiceScopeFactory scopeFactory,
    IOptions<RetrievalIndexingOutboxProcessorOptions> processorOptions,
    TimeProvider timeProvider,
    ILogger<RetrievalIndexingOutboxProcessor> logger)
    : RecoverableOutboxProcessorBase<
            RetrievalIndexingOutboxEntry,
            IRetrievalIndexingOutboxRepository,
            RetrievalIndexingOutboxProcessorOptions>(
        scopeFactory,
        processorOptions,
        timeProvider,
        logger),
        IRetrievalIndexingOutboxProcessor
{
    protected override int GetMaxConcurrentBatchEntries(RetrievalIndexingOutboxProcessorOptions opts) =>
        opts.MaxConcurrentBatchEntries;

    protected override void LogProcessingFailure(Exception fault, RetrievalIndexingOutboxEntry entry)
    {
        if (Logger.IsEnabled(LogLevel.Warning))
        {
            Logger.LogWarning(
                fault,
                "Retrieval outbox processing failed for outbox {OutboxId}, run {RunId}.",
                entry.OutboxId,
                entry.RunId);
        }
    }

    protected override Task OnDeadLetterAsync(
        IServiceScope scope,
        RetrievalIndexingOutboxEntry entry,
        string summary,
        RetrievalIndexingOutboxProcessorOptions opts,
        CancellationToken cancellationToken)
    {
        if (Logger.IsEnabled(LogLevel.Error))
        {
            Logger.LogError(
                "Retrieval indexing outbox dead-lettered outbox {OutboxId}, run {RunId}, after exhausting retries ({Max}). Summary={Summary}",
                entry.OutboxId,
                entry.RunId,
                opts.MaxAttemptsBeforeDeadLetter,
                summary);
        }

        return Task.CompletedTask;
    }

    protected override async Task ProcessEntryAsync(
        IServiceScope scope,
        IRetrievalIndexingOutboxRepository outbox,
        RetrievalIndexingOutboxEntry entry,
        RetrievalIndexingOutboxProcessorOptions opts,
        CancellationToken cancellationToken)
    {
        using Activity? activity = ArchLucidInstrumentation.RetrievalIndexingOutbox.StartActivity(
            "RetrievalIndexingOutbox.ProcessEntry");
        string correlationId = FormattableString.Invariant($"retrieval-outbox:{entry.OutboxId:D}");
        activity?.SetTag(ActivityCorrelation.LogicalCorrelationIdTag, correlationId);
        activity?.SetTag("archlucid.run_id", entry.RunId.ToString("D"));
        activity?.SetTag("archlucid.outbox_id", entry.OutboxId.ToString("D"));

        using IDisposable _ = LogContext.PushProperty("CorrelationId", correlationId);

        ScopeContext scopeContext = new()
        {
            TenantId = entry.TenantId,
            WorkspaceId = entry.WorkspaceId,
            ProjectId = entry.ProjectId
        };

        ActivityScopeTags.ApplyTenantWorkspace(activity, scopeContext);

        if (!CommittedRunEvidenceBinding.HasExplicitScope(scopeContext) || entry.RunId == Guid.Empty)
        {
            await SkipEntryAsync(outbox, entry, "outbox scope or run ID is incomplete", cancellationToken)
                .ConfigureAwait(false);
            return;
        }

        if (!CommittedRunEvidenceBinding.MatchesDrainScope(scopeContext, AmbientScopeContext.CurrentOverride))
        {
            await SkipEntryAsync(outbox, entry, "outbox scope does not match the active drain scope", cancellationToken)
                .ConfigureAwait(false);
            return;
        }

        using IDisposable ambientScope = AmbientScopeContext.Push(scopeContext);

        // The commit pipeline is the only production enqueue caller. Confirm its current run binding from
        // storage before using any evidence cache (this repository operation bypasses the run cache).
        IRunRepository runs = scope.ServiceProvider.GetRequiredService<IRunRepository>();
        RunRecord? run = await runs.GetByIdIncludingArchivedAsync(scopeContext, entry.RunId, cancellationToken)
            .ConfigureAwait(false);
        if (run?.GoldenManifestId is not Guid manifestId ||
            !CommittedRunEvidenceBinding.MatchesRun(scopeContext, entry.RunId, run))
        {
            await SkipEntryAsync(outbox, entry, "no matching active committed run", cancellationToken)
                .ConfigureAwait(false);
            return;
        }

        IAuthorityQueryService query = scope.ServiceProvider.GetRequiredService<IAuthorityQueryService>();
        ManifestDocument? manifest = await query
            .GetManifestForSummaryVerificationAsync(scopeContext, manifestId, cancellationToken)
            .ConfigureAwait(false);
        if (manifest is null || !CommittedRunEvidenceBinding.MatchesManifest(scopeContext, run, manifest))
        {
            await SkipEntryAsync(outbox, entry, "sealed manifest is missing or not bound to the run", cancellationToken)
                .ConfigureAwait(false);
            return;
        }

        IManifestHashService manifestHashService =
            scope.ServiceProvider.GetRequiredService<IManifestHashService>();
        RetrievalIndexingOutboxSealedManifestHashGuard.EnsureGoldenManifestSealedHashOrThrow(
            manifest,
            entry.RunId,
            manifestHashService);

        RunDetailDto? detail = await query
            .GetRunDetailForRetrievalIndexingAsync(scopeContext, run, manifest, cancellationToken)
            .ConfigureAwait(false);
        if (detail?.GraphSnapshot is not { } graphSnapshot || detail.FindingsSnapshot is not { } findings ||
            detail.AuthorityTrace is null || graphSnapshot.GraphSnapshotId != manifest.GraphSnapshotId ||
            graphSnapshot.RunId != run.RunId || findings.FindingsSnapshotId != manifest.FindingsSnapshotId ||
            findings.RunId != run.RunId)
        {
            await SkipEntryAsync(outbox, entry, "run evidence is incomplete or does not match the sealed anchors", cancellationToken)
                .ConfigureAwait(false);
            return;
        }

        IProvenanceBuilder provenanceBuilder = scope.ServiceProvider.GetRequiredService<IProvenanceBuilder>();
        IArtifactQueryService artifactQuery = scope.ServiceProvider.GetRequiredService<IArtifactQueryService>();
        IRetrievalRunCompletionIndexer indexer =
            scope.ServiceProvider.GetRequiredService<IRetrievalRunCompletionIndexer>();
        IReadOnlyList<SynthesizedArtifact> provenanceArtifacts = detail.ArtifactBundle?.Artifacts ?? [];

        DecisionProvenanceGraph graph = provenanceBuilder.Build(new ProvenanceBuildInput
        {
            RunId = run.RunId,
            Findings = findings,
            Graph = graphSnapshot,
            Manifest = manifest,
            DecisionTrace = detail.AuthorityTrace,
            Artifacts = provenanceArtifacts
        });

        IReadOnlyList<SynthesizedArtifact> indexingArtifacts = await artifactQuery
            .GetArtifactsByManifestIdAsync(scopeContext, manifest.ManifestId, cancellationToken)
            .ConfigureAwait(false);

        await indexer.IndexAuthorityRunAsync(
            entry.TenantId,
            entry.WorkspaceId,
            entry.ProjectId,
            manifest,
            indexingArtifacts,
            graph,
            findings,
            graphSnapshot,
            cancellationToken).ConfigureAwait(false);

        await CompleteProcessedEntryAsync(outbox, entry, cancellationToken).ConfigureAwait(false);
    }

    private Task SkipEntryAsync(
        IRetrievalIndexingOutboxRepository outbox,
        RetrievalIndexingOutboxEntry entry,
        string reason,
        CancellationToken ct) =>
        CompleteProcessedEntryAsync(outbox, entry, ct, () =>
        {
            if (Logger.IsEnabled(LogLevel.Warning))
                Logger.LogWarning("Skipping retrieval indexing for run {RunId}: {Reason}.", entry.RunId, reason);
        });

    private async Task CompleteProcessedEntryAsync(
        IRetrievalIndexingOutboxRepository outbox,
        RetrievalIndexingOutboxEntry entry,
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

    protected override RetrievalIndexingOutboxProcessorOptions VerifyOptions(
        RetrievalIndexingOutboxProcessorOptions configured)
    {
        ArgumentNullException.ThrowIfNull(configured);

        (int lease, int maxAttempts, int baseSecs, int maxSecs, int maxConcurrent) =
            OutboxProcessorOptionsVerifier.NormalizeParallelLeaseRetry(
                configured.LeaseDurationSeconds,
                configured.MaxAttemptsBeforeDeadLetter,
                configured.RetryBackoffBaseSeconds,
                configured.RetryBackoffMaxSeconds,
                configured.MaxConcurrentBatchEntries,
                MaxBatchSize);

        return new RetrievalIndexingOutboxProcessorOptions
        {
            LeaseDurationSeconds = lease,
            MaxAttemptsBeforeDeadLetter = maxAttempts,
            RetryBackoffBaseSeconds = baseSecs,
            RetryBackoffMaxSeconds = maxSecs,
            MaxConcurrentBatchEntries = maxConcurrent,
        };
    }
}
