using System.Diagnostics;

using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Models;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.KnowledgeGraph.Models;
using ArchLucid.Persistence.Coordination.Retrieval;
using ArchLucid.Persistence.Orchestration;
using ArchLucid.Persistence.Queries;
using ArchLucid.Provenance;
using ArchLucid.Retrieval.Indexing;

using Microsoft.Extensions.Options;

using Serilog.Context;

namespace ArchLucid.Host.Core.Coordination.Retrieval;

/// <inheritdoc cref="IRetrievalIndexingOutboxProcessor" />
public sealed class RetrievalIndexingOutboxProcessor(
    IServiceScopeFactory scopeFactory,
    IOptions<RetrievalIndexingOutboxProcessorOptions> processorOptions,
    TimeProvider timeProvider,
    ILogger<RetrievalIndexingOutboxProcessor> logger) : IRetrievalIndexingOutboxProcessor
{
    private const int MaxBatch = 25;

    private readonly ILogger<RetrievalIndexingOutboxProcessor> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    private readonly IOptions<RetrievalIndexingOutboxProcessorOptions> _processorOptions =
        processorOptions ?? throw new ArgumentNullException(nameof(processorOptions));

    private readonly IServiceScopeFactory _scopeFactory =
        scopeFactory ?? throw new ArgumentNullException(nameof(scopeFactory));

    private readonly TimeProvider _timeProvider =
        timeProvider ?? throw new ArgumentNullException(nameof(timeProvider));

    /// <inheritdoc />
    public async Task ProcessPendingBatchAsync(CancellationToken ct)
    {
        RetrievalIndexingOutboxProcessorOptions opts = VerifiedOptions(_processorOptions.Value);

        using IServiceScope scope = _scopeFactory.CreateScope();
        IRetrievalIndexingOutboxRepository outbox =
            scope.ServiceProvider.GetRequiredService<IRetrievalIndexingOutboxRepository>();
        IAuthorityQueryService query = scope.ServiceProvider.GetRequiredService<IAuthorityQueryService>();
        IRetrievalRunCompletionIndexer indexer =
            scope.ServiceProvider.GetRequiredService<IRetrievalRunCompletionIndexer>();
        IProvenanceBuilder provenanceBuilder = scope.ServiceProvider.GetRequiredService<IProvenanceBuilder>();

        IReadOnlyList<RetrievalIndexingOutboxEntry> batch =
            await outbox.DequeuePendingAsync(MaxBatch, opts.LeaseDurationSeconds, ct);

        foreach (RetrievalIndexingOutboxEntry entry in batch)

            try
            {
                await ProcessEntryAsync(outbox, query, indexer, provenanceBuilder, entry, ct);
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
        IRetrievalIndexingOutboxRepository outbox,
        IAuthorityQueryService query,
        IRetrievalRunCompletionIndexer indexer,
        IProvenanceBuilder provenanceBuilder,
        RetrievalIndexingOutboxEntry entry,
        CancellationToken ct)
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

        RunDetailDto? detail = await query.GetRunDetailAsync(scopeContext, entry.RunId, ct);

        if (detail?.GoldenManifest is null ||
            detail.GraphSnapshot is null ||
            detail.FindingsSnapshot is null ||
            detail.AuthorityTrace is null)
        {
            _logger.LogWarning(
                "Skipping retrieval indexing for run {RunId}: incomplete run detail.",
                entry.RunId);
            await outbox.MarkProcessedAsync(entry.OutboxId, ct);

            return;
        }

        ManifestDocument manifest = detail.GoldenManifest;
        GraphSnapshot graphSnapshot = detail.GraphSnapshot;
        FindingsSnapshot findings = detail.FindingsSnapshot;
        IReadOnlyList<SynthesizedArtifact> artifacts = detail.ArtifactBundle?.Artifacts ?? [];

        DecisionProvenanceGraph graph = provenanceBuilder.Build(new ProvenanceBuildInput
        {
            RunId = detail.Run.RunId,
            Findings = findings,
            Graph = graphSnapshot,
            Manifest = manifest,
            DecisionTrace = detail.AuthorityTrace,
            Artifacts = artifacts
        });

        await indexer.IndexAuthorityRunAsync(
            entry.TenantId,
            entry.WorkspaceId,
            entry.ProjectId,
            manifest,
            artifacts,
            graph,
            findings,
            ct);

        await outbox.MarkProcessedAsync(entry.OutboxId, ct);
    }

    private async Task OnProcessingFailedAsync(
        IRetrievalIndexingOutboxRepository outbox,
        RetrievalIndexingOutboxEntry entry,
        Exception fault,
        RetrievalIndexingOutboxProcessorOptions opts,
        CancellationToken ct)
    {
        if (_logger.IsEnabled(LogLevel.Warning))

            _logger.LogWarning(
                fault,
                "Retrieval outbox processing failed for outbox {OutboxId}, run {RunId}.",
                entry.OutboxId,
                entry.RunId);

        string summary = AuthorityPipelineWorkErrorSummary.From(fault);

        if (RetriesExhaustedAfterThisFailure(entry, opts))
        {
            await outbox.RecordDeadLetterAsync(entry.OutboxId, summary, ct);

            if (_logger.IsEnabled(LogLevel.Error))

                _logger.LogError(
                    "Retrieval indexing outbox dead-lettered outbox {OutboxId}, run {RunId}, after exhausting retries ({Max}). Summary={Summary}",
                    entry.OutboxId,
                    entry.RunId,
                    opts.MaxAttemptsBeforeDeadLetter,
                    summary);

            return;
        }

        DateTime utcNow = _timeProvider.UtcNowDateTime();
        TimeSpan delay = RetryDelayAfterFailure(entry, opts);
        DateTime nextAttemptUtc = utcNow.Add(delay);

        await outbox.RecordBackoffAfterProcessingFailureAsync(entry.OutboxId, nextAttemptUtc, summary, ct);
    }

    private static bool RetriesExhaustedAfterThisFailure(
        RetrievalIndexingOutboxEntry entry,
        RetrievalIndexingOutboxProcessorOptions opts)
    {
        int max = opts.MaxAttemptsBeforeDeadLetter <= 1 ? 1 : opts.MaxAttemptsBeforeDeadLetter;
        long attemptAfterPersist = entry.AttemptCount + 1L;

        return attemptAfterPersist >= max;
    }

    private static TimeSpan RetryDelayAfterFailure(
        RetrievalIndexingOutboxEntry entry,
        RetrievalIndexingOutboxProcessorOptions opts)
    {
        int floor = opts.RetryBackoffBaseSeconds < 1 ? 1 : opts.RetryBackoffBaseSeconds;
        int cap = opts.RetryBackoffMaxSeconds < floor ? floor : opts.RetryBackoffMaxSeconds;
        double scaled = floor * Math.Pow(2, entry.AttemptCount);
        double clamped = scaled > cap ? cap : scaled;
        double secondsRounded = clamped <= 1 ? 1 : Math.Ceiling(clamped);

        return TimeSpan.FromSeconds(secondsRounded);
    }

    private static RetrievalIndexingOutboxProcessorOptions VerifiedOptions(
        RetrievalIndexingOutboxProcessorOptions configured)
    {
        if (configured is null)
            throw new ArgumentNullException(nameof(configured));

        int lease = ClampInt(configured.LeaseDurationSeconds, 300, 7200);
        int maxAttempts = ClampInt(configured.MaxAttemptsBeforeDeadLetter, 1, 999);
        int baseSecs = ClampInt(configured.RetryBackoffBaseSeconds, 1, 86_400);
        int maxSecs = ClampInt(configured.RetryBackoffMaxSeconds, 1, 86_400 * 7);

        if (maxSecs < baseSecs)
            maxSecs = baseSecs;

        return new RetrievalIndexingOutboxProcessorOptions
        {
            LeaseDurationSeconds = lease,
            MaxAttemptsBeforeDeadLetter = maxAttempts,
            RetryBackoffBaseSeconds = baseSecs,
            RetryBackoffMaxSeconds = maxSecs,
        };
    }

    private static int ClampInt(int value, int minInclusive, int maxInclusive)
    {
        return value < minInclusive ? minInclusive : value > maxInclusive ? maxInclusive : value;
    }
}
