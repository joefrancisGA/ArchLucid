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
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Runs;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.Coordination;
using ArchLucid.Persistence.Coordination.Projection;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
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
        ScopeContext jobScope = new()
        {
            TenantId = entry.TenantId,
            WorkspaceId = entry.WorkspaceId,
            ProjectId = entry.ProjectId
        };

        using IDisposable ambient = AmbientScopeContext.Push(jobScope);

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

        ScopeContext? drainScope = AmbientScopeContext.CurrentOverride;
        bool tenantPurge = entry.WorkType == PostCommitProjectionWorkTypes.SampleRunPurgeForTenant;
        if (!CommittedRunEvidenceBinding.HasExplicitScope(jobScope) ||
            !CommittedRunEvidenceBinding.MatchesDrainScope(jobScope, drainScope) ||
            (tenantPurge && drainScope is not null &&
             (drainScope.WorkspaceId != Guid.Empty || drainScope.ProjectId != Guid.Empty)))
        {
            await SkipEntryAsync(outbox, entry, "invalid or insufficient drain scope", cancellationToken);
            return;
        }

        // The commit pipeline enqueues these known work types. Reject unknown work without hydrating evidence.
        if (!tenantPurge && !IsRunProjection(entry.WorkType))
            throw new InvalidOperationException($"Unknown post-commit projection work type '{entry.WorkType}'.");

        if (entry.RunId is not Guid runId || runId == Guid.Empty)
        {
            await SkipEntryAsync(outbox, entry, "missing triggering run", cancellationToken);
            return;
        }

        using IDisposable ambient = AmbientScopeContext.Push(jobScope);
        IRunRepository runs = scope.ServiceProvider.GetRequiredService<IRunRepository>();
        RunRecord? run = await runs.GetByIdIncludingArchivedAsync(jobScope, runId, cancellationToken)
            .ConfigureAwait(false);
        if (run?.GoldenManifestId is not Guid manifestId ||
            !CommittedRunEvidenceBinding.MatchesRun(jobScope, runId, run) ||
            (tenantPurge && run.IsSample))
        {
            await SkipEntryAsync(outbox, entry, "no valid committed run for the requested work", cancellationToken);
            return;
        }

        IAuthorityQueryService query = scope.ServiceProvider.GetRequiredService<IAuthorityQueryService>();
        ManifestDocument? manifest = await query
            .GetManifestForSummaryVerificationAsync(jobScope, manifestId, cancellationToken)
            .ConfigureAwait(false);
        if (manifest is null || !CommittedRunEvidenceBinding.MatchesManifest(jobScope, run, manifest))
        {
            await SkipEntryAsync(outbox, entry, "manifest is missing or does not match the committed run", cancellationToken);
            return;
        }

        PostCommitProjectionOutboxSealedManifestHashGuard.EnsureGoldenManifestSealedHashOrThrow(
            manifest, runId, scope.ServiceProvider.GetRequiredService<IManifestHashService>());

        bool benignSkip = false;
        if (tenantPurge)
        {
            // This tenant-wide action needs the sealed non-sample trigger plus a tenant-capable system drain.
            await scope.ServiceProvider.GetRequiredService<ISampleRunPurgeService>()
                .PurgeForTenantAsync(jobScope.TenantId, cancellationToken).ConfigureAwait(false);
        }
        else
        {
            benignSkip = await DispatchRunProjectionAsync(scope, entry.WorkType, jobScope, run, manifest, query,
                cancellationToken).ConfigureAwait(false);
        }

        await CompleteProcessedEntryAsync(outbox, entry, benignSkip, cancellationToken).ConfigureAwait(false);
    }

    private static bool IsRunProjection(string workType) =>
        workType is PostCommitProjectionWorkTypes.ProvenanceSnapshotMaterialization or
            PostCommitProjectionWorkTypes.ReviewCompletedEvent or PostCommitProjectionWorkTypes.FindingPriorityRerank or
            PostCommitProjectionWorkTypes.IacStubGeneration or PostCommitProjectionWorkTypes.DecisionEngineV2NodeMaterialization;

    private Task SkipEntryAsync(
        IPostCommitProjectionOutboxRepository outbox, PostCommitProjectionOutboxEntry entry, string reason, CancellationToken ct) =>
        CompleteProcessedEntryAsync(outbox, entry, benignSkip: false, ct, () =>
        {
            if (Logger.IsEnabled(LogLevel.Warning))
                Logger.LogWarning("Skipping post-commit projection outbox {OutboxId}: {Reason}.", entry.OutboxId, reason);
        });

    private async Task CompleteProcessedEntryAsync(
        IPostCommitProjectionOutboxRepository outbox,
        PostCommitProjectionOutboxEntry entry,
        bool benignSkip,
        CancellationToken cancellationToken,
        Action? postMarkObservability = null)
    {
        await outbox.MarkProcessedAsync(entry.OutboxId, cancellationToken).ConfigureAwait(false);

        try
        {
            ArchLucidInstrumentation.RecordPostCommitProjectionOutboxProcessedSuccess();

            if (benignSkip && Logger.IsEnabled(LogLevel.Debug))
            {
                Logger.LogDebug(
                    "Post-commit projection outbox processed with benign skip outbox {OutboxId}, workType {WorkType}.",
                    entry.OutboxId,
                    entry.WorkType);
            }

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

    private static async Task<bool> DispatchRunProjectionAsync(
        IServiceScope scope, string workType, ScopeContext binding, RunRecord run, ManifestDocument manifest,
        IAuthorityQueryService query, CancellationToken ct)
    {
        switch (workType)
        {
            case PostCommitProjectionWorkTypes.ProvenanceSnapshotMaterialization:
                RunDetailDto? detail = await query.GetRunDetailForCommittedProjectionAsync(binding, run, manifest, ct)
                    .ConfigureAwait(false);
                if (detail?.GraphSnapshot is not { } graph || detail.FindingsSnapshot is not { } findings ||
                    detail.AuthorityTrace is null || detail.Run is not { } detailRun ||
                    !CommittedRunEvidenceBinding.MatchesRun(binding, run.RunId, detailRun) ||
                    !CommittedRunEvidenceBinding.MatchesManifest(binding, detailRun, manifest) ||
                    detail.GoldenManifest?.ManifestId != manifest.ManifestId ||
                    graph.GraphSnapshotId != manifest.GraphSnapshotId || graph.RunId != run.RunId ||
                    findings.FindingsSnapshotId != manifest.FindingsSnapshotId || findings.RunId != run.RunId)
                    return true;

                await scope.ServiceProvider.GetRequiredService<IProvenanceGraphAccessService>()
                    .TryMaterializeSnapshotAsync(binding, detail, ct).ConfigureAwait(false);
                break;

            case PostCommitProjectionWorkTypes.ReviewCompletedEvent:
                await scope.ServiceProvider.GetRequiredService<IReviewCompletedEventHandler>()
                    .HandleAsync(new ReviewCompletedEvent
                    {
                        RunId = run.RunId.ToString("N"),
                        ProjectId = binding.ProjectId.ToString("N")
                    }, ct).ConfigureAwait(false);
                break;

            case PostCommitProjectionWorkTypes.FindingPriorityRerank:
                await scope.ServiceProvider.GetRequiredService<IFindingPriorityReranker>()
                    .RerankForCommittedRunAsync(binding, run, ct).ConfigureAwait(false);
                break;

            case PostCommitProjectionWorkTypes.IacStubGeneration:
                await scope.ServiceProvider.GetRequiredService<IFindingIacStubGenerator>()
                    .GenerateAndPersistStubsForCommittedRunAsync(binding, run, ct).ConfigureAwait(false);
                break;

            case PostCommitProjectionWorkTypes.DecisionEngineV2NodeMaterialization:
                await scope.ServiceProvider.GetRequiredService<IDecisionEngineV2NodeMaterializer>()
                    .MaterializeForCommittedRunAsync(binding, run, ct).ConfigureAwait(false);
                break;

            default: throw new InvalidOperationException($"Unknown post-commit projection work type '{workType}'.");
        }
        return false;
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
