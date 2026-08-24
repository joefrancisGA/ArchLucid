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
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Runs;
using ArchLucid.Core.Scoping;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.Coordination;
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
    ILogger<AuthorityPipelineWorkProcessor> logger)
    : RecoverableOutboxProcessorBase<
            AuthorityPipelineWorkOutboxEntry,
            IAuthorityPipelineWorkRepository,
            AuthorityPipelineWorkProcessorOptions>(
        scopeFactory,
        processorOptions,
        timeProvider,
        logger),
        IAuthorityPipelineWorkProcessor
{
    protected override int GetMaxConcurrentBatchEntries(AuthorityPipelineWorkProcessorOptions opts) =>
        opts.MaxConcurrentBatchEntries;

    protected override void LogProcessingFailure(Exception fault, AuthorityPipelineWorkOutboxEntry entry)
    {
        if (Logger.IsEnabled(LogLevel.Warning))
        {
            Logger.LogWarning(
                fault,
                "Authority pipeline work failed for outbox {OutboxId}, run {RunId}.",
                LogSanitizer.Sanitize(entry.OutboxId.ToString()),
                LogSanitizer.Sanitize(entry.RunId.ToString("N")));
        }
    }

    protected override async Task OnDeadLetterAsync(
        IServiceScope scope,
        AuthorityPipelineWorkOutboxEntry entry,
        string summary,
        AuthorityPipelineWorkProcessorOptions opts,
        CancellationToken cancellationToken)
    {
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
            TimeProvider.UtcNowDateTime(),
            cancellationToken);

        if (Logger.IsEnabled(LogLevel.Error))
        {
            Logger.LogError(
                "Authority pipeline work dead-lettered outbox {OutboxId}, run {RunId}, after exhausting retries ({Max}). Summary={Summary}",
                LogSanitizer.Sanitize(entry.OutboxId.ToString()),
                LogSanitizer.Sanitize(entry.RunId.ToString("N")),
                opts.MaxAttemptsBeforeDeadLetter,
                LogSanitizer.Sanitize(summary));
        }
    }

    protected override async Task ProcessEntryAsync(
        IServiceScope scope,
        IAuthorityPipelineWorkRepository workOutbox,
        AuthorityPipelineWorkOutboxEntry entry,
        AuthorityPipelineWorkProcessorOptions opts,
        CancellationToken cancellationToken)
    {
        if (!AuthorityPipelineWorkPayloadJson.TryDeserialize(entry.PayloadJson, out AuthorityPipelineWorkPayload? payload) ||
            payload is null ||
            !payload.IsValidForProcessing())
        {
            Logger.LogError(
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

        IRunRepository runRepository =
            scope.ServiceProvider.GetRequiredService<IRunRepository>();

        RunRecord? persistedRun =
            await runRepository.GetByIdAsync(jobScope, entry.RunId, cancellationToken);

        if (persistedRun is null)
        {
            Logger.LogError(
                "Authority pipeline work outbox {OutboxId} references missing run {RunId}; marking processed.",
                LogSanitizer.Sanitize(entry.OutboxId.ToString()),
                LogSanitizer.Sanitize(entry.RunId.ToString("N")));
            await workOutbox.MarkProcessedAsync(entry.OutboxId, cancellationToken);

            return;
        }

        IAuthorityRunOrchestrator orchestrator =
            scope.ServiceProvider.GetRequiredService<IAuthorityRunOrchestrator>();

        ContextIngestionRequest request = payload.ContextIngestionRequest;
        request.RunId = entry.RunId;
        request.ProjectId = persistedRun.ProjectId;

        Logger.LogInformationAgentExecutionStateTransitionDeferredOutbox(
            entry.RunId,
            "queued_outbox_claimed",
            "authority_pipeline_resume",
            "(none)",
            entry.OutboxId.ToString());

        await orchestrator.CompleteQueuedAuthorityPipelineAsync(request, cancellationToken);

        Logger.LogInformationAgentExecutionStateTransitionDeferredOutbox(
            entry.RunId,
            "authority_pipeline_resume",
            "post_authority_coordination",
            "(none)",
            entry.OutboxId.ToString());

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
            Logger,
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

        Logger.LogInformationAgentExecutionStateTransitionDeferredOutbox(
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

        Logger.LogInformationAgentExecutionStateTransitionDeferredOutbox(
            entry.RunId,
            "agent_tasks_materialized",
            nextAfterMaterialize,
            AgentExecutionStateTransitionTaskIds.Format(materializedTasksForLog),
            entry.OutboxId.ToString());

        Logger.LogInformationAgentExecutionStateTransitionDeferredOutbox(
            entry.RunId,
            nextAfterMaterialize,
            "authority_work_outbox_processed",
            AgentExecutionStateTransitionTaskIds.Format(materializedTasksForLog),
            entry.OutboxId.ToString());

        await workOutbox.MarkProcessedAsync(entry.OutboxId, cancellationToken);
    }

    protected override AuthorityPipelineWorkProcessorOptions VerifyOptions(
        AuthorityPipelineWorkProcessorOptions configured)
    {
        ArgumentNullException.ThrowIfNull(configured);

        (int lease, int maxAttempts, int baseSecs, int maxSecs, int maxConcurrent) =
            OutboxProcessorOptionsVerifier.NormalizeParallelLeaseRetry(
                configured.LeaseDurationSeconds,
                configured.MaxAttemptsBeforeDeadLetter,
                configured.RetryBackoffBaseSeconds,
                configured.RetryBackoffMaxSeconds,
                configured.MaxConcurrentBatchEntries,
                MaxBatchSize,
                minLeaseDurationSeconds: 60);

        return new AuthorityPipelineWorkProcessorOptions
        {
            LeaseDurationSeconds = lease,
            MaxAttemptsBeforeDeadLetter = maxAttempts,
            RetryBackoffBaseSeconds = baseSecs,
            RetryBackoffMaxSeconds = maxSecs,
            MaxConcurrentBatchEntries = maxConcurrent,
        };
    }
}
