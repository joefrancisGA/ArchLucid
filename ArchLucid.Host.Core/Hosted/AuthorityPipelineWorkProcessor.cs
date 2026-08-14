using ArchLucid.Application.AzureExtractor;
using ArchLucid.Application.Agents;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Coordination;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.ContextIngestion.Models;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Persistence.TechnologyLedger;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Agents;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Concurrency;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Runs;
using ArchLucid.Core.Scoping;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Orchestration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using System.Linq;

namespace ArchLucid.Host.Core.Hosted;

/// <inheritdoc cref="IAuthorityPipelineWorkProcessor" />
/// <remarks>
///     When hosted in <c>ArchLucid.Worker</c>, Information-level <c>Agent execution state transition</c> logs cover the
///     deferred authority outbox path (run id, states, task ids, outbox id).
/// </remarks>
public sealed class AuthorityPipelineWorkProcessor(
    IServiceScopeFactory scopeFactory,
    IOptions<AuthorityPipelineWorkProcessorOptions> processorOptions,
    TimeProvider timeProvider,
    ILogger<AuthorityPipelineWorkProcessor> logger) : IAuthorityPipelineWorkProcessor
{
    private const int MaxBatch = 25;

    private readonly IServiceScopeFactory _scopeFactory =
        scopeFactory ?? throw new ArgumentNullException(nameof(scopeFactory));

    private readonly IOptions<AuthorityPipelineWorkProcessorOptions> _processorOptions =
        processorOptions ?? throw new ArgumentNullException(nameof(processorOptions));

    private readonly TimeProvider _timeProvider = timeProvider ?? throw new ArgumentNullException(nameof(timeProvider));

    private readonly ILogger<AuthorityPipelineWorkProcessor> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    /// <inheritdoc />
    public async Task<int> ProcessPendingBatchAsync(CancellationToken cancellationToken)
    {
        AuthorityPipelineWorkProcessorOptions opts = VerifiedOptions(_processorOptions.Value);

        using IServiceScope dequeueScope = _scopeFactory.CreateScope();
        IAuthorityPipelineWorkRepository workOutbox =
            dequeueScope.ServiceProvider.GetRequiredService<IAuthorityPipelineWorkRepository>();

        IReadOnlyList<AuthorityPipelineWorkOutboxEntry> batch =
            await workOutbox.DequeuePendingAsync(MaxBatch, opts.LeaseDurationSeconds, cancellationToken)
                .ConfigureAwait(false);

        await BoundedBatchParallelism.ForEachAsync(
            batch,
            opts.MaxConcurrentBatchEntries,
            (entry, ct) => ProcessEntryWithIsolationAsync(entry, opts, ct),
            cancellationToken).ConfigureAwait(false);

        return batch.Count;
    }

    private async Task ProcessEntryWithIsolationAsync(
        AuthorityPipelineWorkOutboxEntry entry,
        AuthorityPipelineWorkProcessorOptions opts,
        CancellationToken cancellationToken)
    {
        using IServiceScope scope = _scopeFactory.CreateScope();
        IAuthorityPipelineWorkRepository workOutbox =
            scope.ServiceProvider.GetRequiredService<IAuthorityPipelineWorkRepository>();

        try
        {
            await ProcessEntryAsync(scope, entry, workOutbox, cancellationToken).ConfigureAwait(false);
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception ex)
        {
            await OnProcessingFailedAsync(scope, workOutbox, entry, ex, opts, cancellationToken).ConfigureAwait(false);
        }
    }

    private async Task ProcessEntryAsync(
        IServiceScope scope,
        AuthorityPipelineWorkOutboxEntry entry,
        IAuthorityPipelineWorkRepository workOutbox,
        CancellationToken cancellationToken)
    {
        AuthorityPipelineWorkPayload? payload = AuthorityPipelineWorkPayloadJson.Deserialize(entry.PayloadJson);

        if (payload?.ContextIngestionRequest is null ||
            string.IsNullOrWhiteSpace(payload.EvidenceBundleId))
        {
            _logger.LogError(
                "Authority pipeline work outbox {OutboxId} has invalid payload; marking processed.",
                LogSanitizer.Sanitize(entry.OutboxId.ToString()));
            await workOutbox.MarkProcessedAsync(entry.OutboxId, cancellationToken);

            return;
        }

        ScopeContext jobScope = new()
        {
            TenantId = entry.TenantId,
            WorkspaceId = entry.WorkspaceId,
            ProjectId = entry.ProjectId
        };

        using IDisposable _ = AmbientScopeContext.Push(jobScope);

        IAuthorityRunOrchestrator orchestrator =
            scope.ServiceProvider.GetRequiredService<IAuthorityRunOrchestrator>();

        ContextIngestionRequest request = payload.ContextIngestionRequest;
        request.RunId = entry.RunId;

        _logger.LogInformationAgentExecutionStateTransitionDeferredOutbox(
            entry.RunId,
            "queued_outbox_claimed",
            "authority_pipeline_resume",
            "(none)",
            entry.OutboxId.ToString());

        await orchestrator.CompleteQueuedAuthorityPipelineAsync(request, cancellationToken);

        _logger.LogInformationAgentExecutionStateTransitionDeferredOutbox(
            entry.RunId,
            "authority_pipeline_resume",
            "post_authority_coordination",
            "(none)",
            entry.OutboxId.ToString());

        IRunRepository runRepository =
            scope.ServiceProvider.GetRequiredService<IRunRepository>();
        IArchitectureRequestRepository requestRepository =
            scope.ServiceProvider.GetRequiredService<IArchitectureRequestRepository>();
        IEvidenceBundleRepository evidenceBundleRepository =
            scope.ServiceProvider.GetRequiredService<IEvidenceBundleRepository>();
        IAgentTaskRepository taskRepository =
            scope.ServiceProvider.GetRequiredService<IAgentTaskRepository>();

        string runIdN = LogSanitizer.Sanitize(entry.RunId.ToString("N"));
        RunRecord? authorityHeader =
            await runRepository.GetByIdAsync(jobScope, entry.RunId, cancellationToken);

        if (authorityHeader is null)
            throw new InvalidOperationException(
                $"dbo.Runs row missing immediately after CompleteQueuedAuthorityPipelineAsync for run '{entry.RunId:N}'.");

        if (string.IsNullOrWhiteSpace(authorityHeader.ArchitectureRequestId))
            throw new InvalidOperationException(
                $"dbo.Runs.ArchitectureRequestId unset after deferred authority pipeline for run '{entry.RunId:N}'.");

        ArchitectureRequest? architectureRequest =
            await requestRepository.GetByIdAsync(authorityHeader.ArchitectureRequestId, cancellationToken);

        EvidenceBundle? evidenceBundle =
            await evidenceBundleRepository.GetByIdAsync(payload.EvidenceBundleId.Trim(), cancellationToken);

        if (architectureRequest is null || evidenceBundle is null)
            throw new InvalidOperationException(
                $"Evidence bundle / architecture request not available after deferred authority pipeline for run '{entry.RunId:N}'.");

        IAzureExtractorPackageRepository azureExtractorPackages =
            scope.ServiceProvider.GetRequiredService<IAzureExtractorPackageRepository>();

        ICloudInventoryExtractorPackageRepository cloudInventoryExtractorPackages =
            scope.ServiceProvider.GetRequiredService<ICloudInventoryExtractorPackageRepository>();

        if (await RunStarterInventoryEvidenceBundleMerger.MergeLinkedInventoryPackagesAsync(
            evidenceBundle,
            architectureRequest,
            jobScope,
            entry.RunId,
            azureExtractorPackages,
            cloudInventoryExtractorPackages,
            cancellationToken))
        {
            await evidenceBundleRepository.UpdateAsync(evidenceBundle, cancellationToken);
        }

        ScopeContext materializedScope = AmbientScopeContext.CurrentOverride ?? jobScope;

        TechnologyLedgerRequestSeeder requestSeeder =
            scope.ServiceProvider.GetRequiredService<TechnologyLedgerRequestSeeder>();
        TechnologyLedgerEvidenceSeeder evidenceSeeder =
            scope.ServiceProvider.GetRequiredService<TechnologyLedgerEvidenceSeeder>();
        ITechnologyLedgerRepository technologyLedgerRepository =
            scope.ServiceProvider.GetRequiredService<ITechnologyLedgerRepository>();

        await TechnologyLedgerRunCreateSeeding.TrySeedIntakeAsync(
            runIdN,
            architectureRequest,
            requestSeeder,
            evidenceSeeder,
            _logger,
            cancellationToken);

        IReadOnlyList<TechnologyLedgerEntry> ledgerEntries =
            await technologyLedgerRepository.GetByRunIdAsync(materializedScope, runIdN, cancellationToken);

        IModelExecutionProfileResolver profileResolver =
            scope.ServiceProvider.GetRequiredService<IModelExecutionProfileResolver>();

        ModelExecutionProfileResolution profileResolution =
            await profileResolver.ResolveForRunCreateAsync(architectureRequest, cancellationToken).ConfigureAwait(false);

        List<AgentTask> starterTasks =
            RunStarterTaskFactory.BuildStarterTasks(
                runIdN,
                evidenceBundle,
                architectureRequest,
                ledgerEntries,
                profileResolution.EffectiveProfile);

        if (!string.IsNullOrWhiteSpace(profileResolution.RequestedOverrideRaw))
        {
            IAuditService auditService = scope.ServiceProvider.GetRequiredService<IAuditService>();
            IScopeContextProvider scopeContextProvider =
                scope.ServiceProvider.GetRequiredService<IScopeContextProvider>();

            await ModelExecutionProfileOverrideAuditWriter.TryLogOverrideAppliedAsync(
                auditService,
                scopeContextProvider,
                runIdN,
                profileResolution,
                cancellationToken).ConfigureAwait(false);
        }

        IReadOnlyList<AgentTask> existingTasks =
            await taskRepository.GetByRunIdAsync(materializedScope, runIdN, cancellationToken);

        if (existingTasks.Count == 0)

            await taskRepository.CreateManyAsync(starterTasks, cancellationToken);

        IReadOnlyList<AgentTask> materializedTasksForLog =
            existingTasks.Count > 0 ? existingTasks : starterTasks;

        _logger.LogInformationAgentExecutionStateTransitionDeferredOutbox(
            entry.RunId,
            "post_authority_coordination",
            "agent_tasks_materialized",
            AgentExecutionStateTransitionTaskIds.Format(materializedTasksForLog),
            entry.OutboxId.ToString());

        RunRecord? statusPatch = await runRepository.GetByIdAsync(jobScope, entry.RunId, cancellationToken);
        IRunStateTransitionService runStateTransitions =
            scope.ServiceProvider.GetRequiredService<IRunStateTransitionService>();

        string nextAfterMaterialize;

        if (statusPatch is null)
            nextAfterMaterialize = "run_legacy_status_patch_skipped";
        else if (string.Equals(
                     statusPatch.LegacyRunStatus,
                     nameof(ArchitectureRunStatus.TasksGenerated),
                     StringComparison.Ordinal))
            nextAfterMaterialize = "run_legacy_status_already_tasks_generated";
        else if (runStateTransitions.ShouldSetTasksGeneratedAfterDeferredMaterialize(statusPatch.LegacyRunStatus))
        {
            // Only Created (or unset) → TasksGenerated. Never demote ReadyForCommit after seed/execute raced ahead.
            statusPatch.LegacyRunStatus = nameof(ArchitectureRunStatus.TasksGenerated);
            await runRepository.UpdateAsync(statusPatch, cancellationToken);
            nextAfterMaterialize = "run_legacy_status_tasks_generated";
        }
        else
            nextAfterMaterialize = "run_legacy_status_left_advanced";

        _logger.LogInformationAgentExecutionStateTransitionDeferredOutbox(
            entry.RunId,
            "agent_tasks_materialized",
            nextAfterMaterialize,
            AgentExecutionStateTransitionTaskIds.Format(materializedTasksForLog),
            entry.OutboxId.ToString());

        _logger.LogInformationAgentExecutionStateTransitionDeferredOutbox(
            entry.RunId,
            nextAfterMaterialize,
            "authority_work_outbox_processed",
            AgentExecutionStateTransitionTaskIds.Format(materializedTasksForLog),
            entry.OutboxId.ToString());

        await workOutbox.MarkProcessedAsync(entry.OutboxId, cancellationToken);
    }

    private async Task OnProcessingFailedAsync(
        IServiceScope scope,
        IAuthorityPipelineWorkRepository workOutbox,
        AuthorityPipelineWorkOutboxEntry entry,
        Exception fault,
        AuthorityPipelineWorkProcessorOptions opts,
        CancellationToken cancellationToken)
    {
        if (_logger.IsEnabled(LogLevel.Warning))

            _logger.LogWarning(
                fault,
                "Authority pipeline work failed for outbox {OutboxId}, run {RunId}.",
                LogSanitizer.Sanitize(entry.OutboxId.ToString()),
                LogSanitizer.Sanitize(entry.RunId.ToString("N")));

        string summary = AuthorityPipelineWorkErrorSummary.From(fault);

        if (RetriesExhaustedAfterThisFailure(entry, opts))
        {
            await workOutbox.RecordDeadLetterAsync(entry.OutboxId, summary, cancellationToken);

            ScopeContext jobScope = new()
            {
                TenantId = entry.TenantId,
                WorkspaceId = entry.WorkspaceId,
                ProjectId = entry.ProjectId
            };

            IRunRepository runRepository =
                scope.ServiceProvider.GetRequiredService<IRunRepository>();

            await AuthorityPipelineDeadLetterRunMarker.TryMarkRunDeadLetteredAsync(
                runRepository,
                jobScope,
                entry.RunId,
                summary,
                _timeProvider.UtcNowDateTime(),
                cancellationToken);

            if (_logger.IsEnabled(LogLevel.Error))

                _logger.LogError(
                    "Authority pipeline work dead-lettered outbox {OutboxId}, run {RunId}, after exhausting retries ({Max}). Summary={Summary}",
                    LogSanitizer.Sanitize(entry.OutboxId.ToString()),
                    LogSanitizer.Sanitize(entry.RunId.ToString("N")),
                    opts.MaxAttemptsBeforeDeadLetter,
                    LogSanitizer.Sanitize(summary));

            return;
        }

        DateTime utcNow = _timeProvider.UtcNowDateTime();

        TimeSpan delay = RetryDelayAfterFailure(entry, opts);

        DateTime nextAttemptUtc = utcNow.Add(delay);

        await workOutbox.RecordBackoffAfterProcessingFailureAsync(entry.OutboxId, nextAttemptUtc, summary,
            cancellationToken);
    }

    private static bool RetriesExhaustedAfterThisFailure(
        AuthorityPipelineWorkOutboxEntry entry,
        AuthorityPipelineWorkProcessorOptions opts)
    {
        int max = opts.MaxAttemptsBeforeDeadLetter <= 1 ? 1 : opts.MaxAttemptsBeforeDeadLetter;
        long attemptAfterPersist = entry.AttemptCount + 1L;

        return attemptAfterPersist >= max;
    }

    private static TimeSpan RetryDelayAfterFailure(
        AuthorityPipelineWorkOutboxEntry entry,
        AuthorityPipelineWorkProcessorOptions opts)
    {
        int floor = opts.RetryBackoffBaseSeconds < 1 ? 1 : opts.RetryBackoffBaseSeconds;
        int cap = opts.RetryBackoffMaxSeconds < floor ? floor : opts.RetryBackoffMaxSeconds;
        double scaled = floor * Math.Pow(2, entry.AttemptCount);
        double clamped = scaled > cap ? cap : scaled;
        double secondsRounded = clamped <= 1 ? 1 : Math.Ceiling(clamped);

        return TimeSpan.FromSeconds(secondsRounded);
    }

    private static AuthorityPipelineWorkProcessorOptions VerifiedOptions(AuthorityPipelineWorkProcessorOptions configured)
    {
        if (configured is null)
            throw new ArgumentNullException(nameof(configured));

        int lease = ClampInt(configured.LeaseDurationSeconds, 60, 7200);
        int maxAttempts = ClampInt(configured.MaxAttemptsBeforeDeadLetter, 1, 999);
        int baseSecs = ClampInt(configured.RetryBackoffBaseSeconds, 1, 86_400);
        int maxSecs = ClampInt(configured.RetryBackoffMaxSeconds, 1, 86_400 * 7);
        int maxConcurrent = ClampInt(configured.MaxConcurrentBatchEntries, 1, MaxBatch);

        if (maxSecs < baseSecs)
            maxSecs = baseSecs;

        return new AuthorityPipelineWorkProcessorOptions
        {
            LeaseDurationSeconds = lease,
            MaxAttemptsBeforeDeadLetter = maxAttempts,
            RetryBackoffBaseSeconds = baseSecs,
            RetryBackoffMaxSeconds = maxSecs,
            MaxConcurrentBatchEntries = maxConcurrent,
        };
    }

    private static int ClampInt(int value, int minInclusive, int maxInclusive)
    {
        return value < minInclusive ? minInclusive : value > maxInclusive ? maxInclusive : value;
    }
}
