using System.Diagnostics;

using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Models;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.Coordination;
using ArchLucid.Persistence.Coordination.Retrieval;
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
        IAuthorityQueryService query = scope.ServiceProvider.GetRequiredService<IAuthorityQueryService>();
        IArtifactQueryService artifactQuery = scope.ServiceProvider.GetRequiredService<IArtifactQueryService>();
        IRetrievalRunCompletionIndexer indexer =
            scope.ServiceProvider.GetRequiredService<IRetrievalRunCompletionIndexer>();
        IProvenanceBuilder provenanceBuilder = scope.ServiceProvider.GetRequiredService<IProvenanceBuilder>();

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

        using IDisposable ambientScope = AmbientScopeContext.Push(scopeContext);

        RunDetailDto? detail = await query.GetRunDetailForRetrievalIndexingAsync(scopeContext, entry.RunId, cancellationToken)
            .ConfigureAwait(false);

        if (detail?.GoldenManifest is null ||
            detail.GraphSnapshot is null ||
            detail.FindingsSnapshot is null ||
            detail.AuthorityTrace is null)
        {
            Logger.LogWarning(
                "Skipping retrieval indexing for run {RunId}: incomplete run detail.",
                entry.RunId);
            await outbox.MarkProcessedAsync(entry.OutboxId, cancellationToken).ConfigureAwait(false);

            return;
        }

        ManifestDocument manifest = detail.GoldenManifest;
        GraphSnapshot graphSnapshot = detail.GraphSnapshot;
        FindingsSnapshot findings = detail.FindingsSnapshot;
        IReadOnlyList<SynthesizedArtifact> provenanceArtifacts = detail.ArtifactBundle?.Artifacts ?? [];

        DecisionProvenanceGraph graph = provenanceBuilder.Build(new ProvenanceBuildInput
        {
            RunId = detail.Run.RunId,
            Findings = findings,
            Graph = graphSnapshot,
            Manifest = manifest,
            DecisionTrace = detail.AuthorityTrace,
            Artifacts = provenanceArtifacts
        });

        IReadOnlyList<SynthesizedArtifact> indexingArtifacts = provenanceArtifacts;

        if (manifest.ManifestId != Guid.Empty)
        {
            indexingArtifacts = await artifactQuery
                .GetArtifactsByManifestIdAsync(scopeContext, manifest.ManifestId, cancellationToken)
                .ConfigureAwait(false);
        }

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

        await outbox.MarkProcessedAsync(entry.OutboxId, cancellationToken).ConfigureAwait(false);
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
