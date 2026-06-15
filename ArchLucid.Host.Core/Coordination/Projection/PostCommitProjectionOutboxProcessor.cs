using System.Diagnostics;

using ArchLucid.Application.Agents.IaC;
using ArchLucid.Application.Findings;
using ArchLucid.Application.Provenance;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Application.Runs.Orchestration.Events;
using ArchLucid.Application.Runs.Sample;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Scoping;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Persistence.Coordination.Projection;
using ArchLucid.Persistence.Orchestration;
using ArchLucid.Persistence.Queries;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

using Serilog.Context;

namespace ArchLucid.Host.Core.Coordination.Projection;

/// <inheritdoc cref="IPostCommitProjectionOutboxProcessor" />
public sealed class PostCommitProjectionOutboxProcessor(
    IServiceScopeFactory scopeFactory,
    IOptions<PostCommitProjectionOutboxProcessorOptions> processorOptions,
    TimeProvider timeProvider,
    ILogger<PostCommitProjectionOutboxProcessor> logger) : IPostCommitProjectionOutboxProcessor
{
    private const int MaxBatch = 25;

    private readonly ILogger<PostCommitProjectionOutboxProcessor> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    private readonly IOptions<PostCommitProjectionOutboxProcessorOptions> _processorOptions =
        processorOptions ?? throw new ArgumentNullException(nameof(processorOptions));

    private readonly IServiceScopeFactory _scopeFactory =
        scopeFactory ?? throw new ArgumentNullException(nameof(scopeFactory));

    private readonly TimeProvider _timeProvider =
        timeProvider ?? throw new ArgumentNullException(nameof(timeProvider));

    /// <inheritdoc />
    public async Task ProcessPendingBatchAsync(CancellationToken ct)
    {
        PostCommitProjectionOutboxProcessorOptions opts = VerifiedOptions(_processorOptions.Value);

        using IServiceScope scope = _scopeFactory.CreateScope();
        IPostCommitProjectionOutboxRepository outbox =
            scope.ServiceProvider.GetRequiredService<IPostCommitProjectionOutboxRepository>();
        IAuditService auditService = scope.ServiceProvider.GetRequiredService<IAuditService>();

        IReadOnlyList<PostCommitProjectionOutboxEntry> batch =
            await outbox.DequeuePendingAsync(MaxBatch, opts.LeaseDurationSeconds, ct);

        foreach (PostCommitProjectionOutboxEntry entry in batch)

            try
            {
                await ProcessEntryAsync(scope, outbox, auditService, entry, ct);
            }
            catch (OperationCanceledException)
            {
                throw;
            }
            catch (Exception ex)
            {
                await OnProcessingFailedAsync(outbox, auditService, entry, ex, opts, ct);
            }
    }

    private async Task ProcessEntryAsync(
        IServiceScope scope,
        IPostCommitProjectionOutboxRepository outbox,
        IAuditService auditService,
        PostCommitProjectionOutboxEntry entry,
        CancellationToken ct)
    {
        using Activity? activity = ArchLucidInstrumentation.AuthorityRun.StartActivity(
            "PostCommitProjectionOutbox.ProcessEntry");
        string correlationId = FormattableString.Invariant($"post-commit-projection-outbox:{entry.OutboxId:D}");
        activity?.SetTag(ActivityCorrelation.LogicalCorrelationIdTag, correlationId);
        activity?.SetTag("archlucid.outbox_id", entry.OutboxId.ToString("D"));
        activity?.SetTag("archlucid.work_type", entry.WorkType);

        if (entry.RunId is Guid runIdTag)
            activity?.SetTag("archlucid.run_id", runIdTag.ToString("D"));

        ScopeContext jobScope = new()
        {
            TenantId = entry.TenantId,
            WorkspaceId = entry.WorkspaceId,
            ProjectId = entry.ProjectId
        };

        ActivityScopeTags.ApplyTenantWorkspace(activity, jobScope);

        using IDisposable _ = LogContext.PushProperty("CorrelationId", correlationId);

        using IDisposable ambient = AmbientScopeContext.Push(jobScope);

        bool benignSkip = await DispatchWorkTypeAsync(scope, entry, jobScope, ct);

        await outbox.MarkProcessedAsync(entry.OutboxId, ct);
        ArchLucidInstrumentation.RecordPostCommitProjectionOutboxProcessedSuccess();

        if (benignSkip && _logger.IsEnabled(LogLevel.Debug))
            _logger.LogDebug(
                "Post-commit projection outbox processed with benign skip outbox {OutboxId}, workType {WorkType}.",
                entry.OutboxId,
                entry.WorkType);
    }

    private async Task<bool> DispatchWorkTypeAsync(
        IServiceScope scope,
        PostCommitProjectionOutboxEntry entry,
        ScopeContext jobScope,
        CancellationToken ct)
    {
        if (entry.WorkType == PostCommitProjectionWorkTypes.ProvenanceSnapshotMaterialization)
            return await ProcessProvenanceSnapshotMaterializationAsync(scope, entry, jobScope, ct);

        if (entry.WorkType == PostCommitProjectionWorkTypes.ReviewCompletedEvent)
        {
            await ProcessReviewCompletedEventAsync(scope, entry, ct);

            return false;
        }

        if (entry.WorkType == PostCommitProjectionWorkTypes.SampleRunPurgeForTenant)
        {
            await ProcessSampleRunPurgeForTenantAsync(scope, entry.TenantId, ct);

            return false;
        }

        if (entry.WorkType == PostCommitProjectionWorkTypes.FindingPriorityRerank)
        {
            await ProcessFindingPriorityRerankAsync(scope, entry, ct);

            return false;
        }

        if (entry.WorkType == PostCommitProjectionWorkTypes.IacStubGeneration)
        {
            await ProcessIacStubGenerationAsync(scope, entry, ct);

            return false;
        }

        throw new InvalidOperationException($"Unknown post-commit projection work type '{entry.WorkType}'.");
    }

    private static async Task<bool> ProcessProvenanceSnapshotMaterializationAsync(
        IServiceScope scope,
        PostCommitProjectionOutboxEntry entry,
        ScopeContext jobScope,
        CancellationToken ct)
    {
        if (entry.RunId is not Guid runId)
            throw new InvalidOperationException("ProvenanceSnapshotMaterialization requires RunId.");

        IAuthorityQueryService authorityQuery =
            scope.ServiceProvider.GetRequiredService<IAuthorityQueryService>();
        IProvenanceGraphAccessService provenanceGraphAccess =
            scope.ServiceProvider.GetRequiredService<IProvenanceGraphAccessService>();

        RunDetailDto? detail = await authorityQuery.GetRunDetailAsync(jobScope, runId, ct);

        if (detail is null)
            return true;

        await provenanceGraphAccess.TryMaterializeSnapshotAsync(jobScope, detail, ct);

        return false;
    }

    private static async Task ProcessReviewCompletedEventAsync(
        IServiceScope scope,
        PostCommitProjectionOutboxEntry entry,
        CancellationToken ct)
    {
        if (entry.RunId is not Guid runGuid)
            throw new InvalidOperationException("ReviewCompletedEvent requires RunId.");

        PostCommitProjectionPayload? payload = PostCommitProjectionPayloadJson.Deserialize(entry.PayloadJson);
        string projectId = payload?.ProjectId ?? entry.ProjectId.ToString("N");
        string runId = runGuid.ToString("N");

        IReviewCompletedEventHandler handler =
            scope.ServiceProvider.GetRequiredService<IReviewCompletedEventHandler>();

        await handler.HandleAsync(
            new ReviewCompletedEvent { RunId = runId, ProjectId = projectId },
            ct);
    }

    private static async Task ProcessSampleRunPurgeForTenantAsync(
        IServiceScope scope,
        Guid tenantId,
        CancellationToken ct)
    {
        ISampleRunPurgeService purgeService = scope.ServiceProvider.GetRequiredService<ISampleRunPurgeService>();

        await purgeService.PurgeForTenantAsync(tenantId, ct);
    }

    private static async Task ProcessFindingPriorityRerankAsync(
        IServiceScope scope,
        PostCommitProjectionOutboxEntry entry,
        CancellationToken ct)
    {
        if (entry.RunId is not Guid runGuid)
            throw new InvalidOperationException("FindingPriorityRerank requires RunId.");

        IFindingPriorityReranker reranker = scope.ServiceProvider.GetRequiredService<IFindingPriorityReranker>();

        await reranker.RerankForRunAsync(runGuid.ToString("N"), ct);
    }

    private static async Task ProcessIacStubGenerationAsync(
        IServiceScope scope,
        PostCommitProjectionOutboxEntry entry,
        CancellationToken ct)
    {
        if (entry.RunId is not Guid runGuid)
            throw new InvalidOperationException("IacStubGeneration requires RunId.");

        IFindingIacStubGenerator generator = scope.ServiceProvider.GetRequiredService<IFindingIacStubGenerator>();

        await generator.GenerateAndPersistStubsForRunAsync(runGuid.ToString("N"), ct);
    }

    private async Task OnProcessingFailedAsync(
        IPostCommitProjectionOutboxRepository outbox,
        IAuditService auditService,
        PostCommitProjectionOutboxEntry entry,
        Exception fault,
        PostCommitProjectionOutboxProcessorOptions opts,
        CancellationToken ct)
    {
        if (_logger.IsEnabled(LogLevel.Warning))

            _logger.LogWarning(
                fault,
                "Post-commit projection outbox processing failed for outbox {OutboxId}, workType {WorkType}, run {RunId}.",
                entry.OutboxId,
                entry.WorkType,
                entry.RunId?.ToString("D") ?? "(none)");

        string summary = AuthorityPipelineWorkErrorSummary.From(fault);

        if (RetriesExhaustedAfterThisFailure(entry, opts))
        {
            await outbox.RecordDeadLetterAsync(entry.OutboxId, summary, ct);
            ArchLucidInstrumentation.RecordPostCommitProjectionOutboxDeadLettered();
            await LogDeadLetterAuditAsync(auditService, entry.RunId, ct);

            if (_logger.IsEnabled(LogLevel.Error))

                _logger.LogError(
                    "Post-commit projection outbox dead-lettered outbox {OutboxId}, workType {WorkType}, run {RunId}, after exhausting retries ({Max}). Summary={Summary}",
                    entry.OutboxId,
                    entry.WorkType,
                    entry.RunId?.ToString("D") ?? "(none)",
                    opts.MaxAttemptsBeforeDeadLetter,
                    summary);

            return;
        }

        DateTime utcNow = _timeProvider.UtcNowDateTime();
        TimeSpan delay = RetryDelayAfterFailure(entry, opts);
        DateTime nextAttemptUtc = utcNow.Add(delay);

        await outbox.RecordBackoffAfterProcessingFailureAsync(entry.OutboxId, nextAttemptUtc, summary, ct);
        ArchLucidInstrumentation.RecordPostCommitProjectionOutboxRetryScheduled();
    }

    [InformationalAudit]
    private static async Task LogDeadLetterAuditAsync(IAuditService auditService, Guid? runId, CancellationToken ct)
    {
        await auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.PostCommitProjectionDeadLettered,
                RunId = runId
            },
            ct);
    }

    private static bool RetriesExhaustedAfterThisFailure(
        PostCommitProjectionOutboxEntry entry,
        PostCommitProjectionOutboxProcessorOptions opts)
    {
        int max = opts.MaxAttemptsBeforeDeadLetter <= 1 ? 1 : opts.MaxAttemptsBeforeDeadLetter;
        long attemptAfterPersist = entry.AttemptCount + 1L;

        return attemptAfterPersist >= max;
    }

    private static TimeSpan RetryDelayAfterFailure(
        PostCommitProjectionOutboxEntry entry,
        PostCommitProjectionOutboxProcessorOptions opts)
    {
        int floor = opts.RetryBackoffBaseSeconds < 1 ? 1 : opts.RetryBackoffBaseSeconds;
        int cap = opts.RetryBackoffMaxSeconds < floor ? floor : opts.RetryBackoffMaxSeconds;
        double scaled = floor * Math.Pow(2, entry.AttemptCount);
        double clamped = scaled > cap ? cap : scaled;
        double secondsRounded = clamped <= 1 ? 1 : Math.Ceiling(clamped);

        return TimeSpan.FromSeconds(secondsRounded);
    }

    private static PostCommitProjectionOutboxProcessorOptions VerifiedOptions(
        PostCommitProjectionOutboxProcessorOptions configured)
    {
        if (configured is null)
            throw new ArgumentNullException(nameof(configured));

        int lease = ClampInt(configured.LeaseDurationSeconds, 300, 7200);
        int maxAttempts = ClampInt(configured.MaxAttemptsBeforeDeadLetter, 1, 999);
        int baseSecs = ClampInt(configured.RetryBackoffBaseSeconds, 1, 86_400);
        int maxSecs = ClampInt(configured.RetryBackoffMaxSeconds, 1, 86_400 * 7);

        if (maxSecs < baseSecs)
            maxSecs = baseSecs;

        return new PostCommitProjectionOutboxProcessorOptions
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
