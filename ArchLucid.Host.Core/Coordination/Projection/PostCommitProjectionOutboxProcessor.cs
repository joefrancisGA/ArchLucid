using System.Diagnostics;

using ArchLucid.Application.Agents.IaC;
using ArchLucid.Application.Coordination;
using ArchLucid.Application.Findings;
using ArchLucid.Application.Provenance;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Application.Runs.Orchestration.Events;
using ArchLucid.Application.Runs.Sample;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.Coordination;
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
    ILogger<PostCommitProjectionOutboxProcessor> logger)
    : RecoverableOutboxProcessorBase<
            PostCommitProjectionOutboxEntry,
            IPostCommitProjectionOutboxRepository,
            PostCommitProjectionOutboxProcessorOptions>(
        scopeFactory,
        processorOptions,
        timeProvider,
        logger),
        IPostCommitProjectionOutboxProcessor
{
    protected override int GetMaxConcurrentBatchEntries(PostCommitProjectionOutboxProcessorOptions opts) =>
        opts.MaxConcurrentBatchEntries;

    protected override void LogProcessingFailure(Exception fault, PostCommitProjectionOutboxEntry entry)
    {
        if (Logger.IsEnabled(LogLevel.Warning))
        {
            Logger.LogWarning(
                fault,
                "Post-commit projection outbox processing failed for outbox {OutboxId}, workType {WorkType}, run {RunId}.",
                entry.OutboxId,
                entry.WorkType,
                entry.RunId?.ToString("D") ?? "(none)");
        }
    }

    protected override async Task OnDeadLetterAsync(
        IServiceScope scope,
        PostCommitProjectionOutboxEntry entry,
        string summary,
        PostCommitProjectionOutboxProcessorOptions opts,
        CancellationToken cancellationToken)
    {
        IAuditService auditService = scope.ServiceProvider.GetRequiredService<IAuditService>();
        ArchLucidInstrumentation.RecordPostCommitProjectionOutboxDeadLettered();
        await LogDeadLetterAuditAsync(auditService, entry.RunId, cancellationToken).ConfigureAwait(false);

        if (Logger.IsEnabled(LogLevel.Error))
        {
            Logger.LogError(
                "Post-commit projection outbox dead-lettered outbox {OutboxId}, workType {WorkType}, run {RunId}, after exhausting retries ({Max}). Summary={Summary}",
                entry.OutboxId,
                entry.WorkType,
                entry.RunId?.ToString("D") ?? "(none)",
                opts.MaxAttemptsBeforeDeadLetter,
                summary);
        }
    }

    protected override Task OnRetryScheduledAsync(
        PostCommitProjectionOutboxEntry entry,
        PostCommitProjectionOutboxProcessorOptions opts,
        CancellationToken cancellationToken)
    {
        ArchLucidInstrumentation.RecordPostCommitProjectionOutboxRetryScheduled();

        return Task.CompletedTask;
    }

    protected override async Task ProcessEntryAsync(
        IServiceScope scope,
        IPostCommitProjectionOutboxRepository outbox,
        PostCommitProjectionOutboxEntry entry,
        PostCommitProjectionOutboxProcessorOptions opts,
        CancellationToken cancellationToken)
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

        if (entry.RunId is Guid runId)
        {
            IAuthorityQueryService authorityQueryService =
                scope.ServiceProvider.GetRequiredService<IAuthorityQueryService>();
            IManifestHashService manifestHashService =
                scope.ServiceProvider.GetRequiredService<IManifestHashService>();

            await PostCommitProjectionOutboxSealedManifestHashGuard.EnsureRunSealedManifestHashOrThrowAsync(
                runId,
                jobScope,
                authorityQueryService,
                manifestHashService,
                cancellationToken).ConfigureAwait(false);
        }

        bool benignSkip = await DispatchWorkTypeAsync(scope, entry, jobScope, cancellationToken);

        await outbox.MarkProcessedAsync(entry.OutboxId, cancellationToken);
        ArchLucidInstrumentation.RecordPostCommitProjectionOutboxProcessedSuccess();

        if (benignSkip && Logger.IsEnabled(LogLevel.Debug))
        {
            Logger.LogDebug(
                "Post-commit projection outbox processed with benign skip outbox {OutboxId}, workType {WorkType}.",
                entry.OutboxId,
                entry.WorkType);
        }
    }

    protected override PostCommitProjectionOutboxProcessorOptions VerifyOptions(
        PostCommitProjectionOutboxProcessorOptions configured)
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

        return new PostCommitProjectionOutboxProcessorOptions
        {
            LeaseDurationSeconds = lease,
            MaxAttemptsBeforeDeadLetter = maxAttempts,
            RetryBackoffBaseSeconds = baseSecs,
            RetryBackoffMaxSeconds = maxSecs,
            MaxConcurrentBatchEntries = maxConcurrent,
        };
    }

    private static async Task<bool> DispatchWorkTypeAsync(
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

        if (entry.WorkType == PostCommitProjectionWorkTypes.DecisionEngineV2NodeMaterialization)
        {
            await ProcessDecisionEngineV2NodeMaterializationAsync(scope, entry, ct);

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

    private static async Task ProcessDecisionEngineV2NodeMaterializationAsync(
        IServiceScope scope,
        PostCommitProjectionOutboxEntry entry,
        CancellationToken ct)
    {
        if (entry.RunId is not Guid runGuid)
            throw new InvalidOperationException("DecisionEngineV2NodeMaterialization requires RunId.");

        IDecisionEngineV2NodeMaterializer materializer =
            scope.ServiceProvider.GetRequiredService<IDecisionEngineV2NodeMaterializer>();

        await materializer.MaterializeIfMissingAsync(runGuid.ToString("N"), ct);
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
}
