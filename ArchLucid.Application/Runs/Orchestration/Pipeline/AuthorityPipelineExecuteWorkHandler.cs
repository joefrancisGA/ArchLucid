using ArchLucid.Application.Agents;
using ArchLucid.Application.AzureExtractor;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Coordination;
using ArchLucid.ContextIngestion.Models;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Persistence.TechnologyLedger;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.Agents;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Core.Runs;
using ArchLucid.Core.Scoping;
using ArchLucid.Application.Runs.TechnologyLedger;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Orchestration;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Runs.Orchestration.Pipeline;

/// <summary>
///     Resumes deferred authority pipeline coordination and materializes starter agent tasks.
/// </summary>
public sealed class AuthorityPipelineExecuteWorkHandler(
    IServiceScopeFactory scopeFactory,
    ILogger<AuthorityPipelineExecuteWorkHandler> logger) : IAuthorityPipelineWorkHandler
{
    private readonly IServiceScopeFactory _scopeFactory =
        scopeFactory ?? throw new ArgumentNullException(nameof(scopeFactory));

    private readonly ILogger<AuthorityPipelineExecuteWorkHandler> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    public AuthorityPipelineWorkKind Kind => AuthorityPipelineWorkKind.Execute;

    public bool CanHandle(AuthorityPipelineWorkPayload payload) => payload.IsValidForProcessing();

    public async Task HandleAsync(
        AuthorityPipelineWorkOutboxEntry entry,
        AuthorityPipelineWorkPayload payload,
        CancellationToken cancellationToken)
    {
        using IServiceScope scope = _scopeFactory.CreateScope();

        ScopeContext jobScope = new()
        {
            TenantId = entry.TenantId,
            WorkspaceId = entry.WorkspaceId,
            ProjectId = entry.ProjectId,
        };

        using IDisposable _ = AmbientScopeContext.Push(jobScope);

        IRunRepository runRepository = scope.ServiceProvider.GetRequiredService<IRunRepository>();
        RunRecord? persistedRun = await runRepository.GetByIdAsync(jobScope, entry.RunId, cancellationToken)
            .ConfigureAwait(false);

        if (persistedRun is null)
            throw new InvalidOperationException($"dbo.Runs row missing for deferred authority pipeline run '{entry.RunId:N}'.");

        IAuthorityRunOrchestrator orchestrator = scope.ServiceProvider.GetRequiredService<IAuthorityRunOrchestrator>();
        ContextIngestionRequest request = payload.ContextIngestionRequest;
        request.RunId = entry.RunId;
        request.ProjectId = persistedRun.ProjectId;

        _logger.LogInformationAgentExecutionStateTransitionDeferredOutbox(
            entry.RunId,
            "queued_outbox_claimed",
            "authority_pipeline_resume",
            "(none)",
            entry.OutboxId.ToString());

        await orchestrator.CompleteQueuedAuthorityPipelineAsync(request, cancellationToken).ConfigureAwait(false);

        _logger.LogInformationAgentExecutionStateTransitionDeferredOutbox(
            entry.RunId,
            "authority_pipeline_resume",
            "post_authority_coordination",
            "(none)",
            entry.OutboxId.ToString());

        await MaterializeAgentTasksAsync(scope, entry, payload, jobScope, cancellationToken).ConfigureAwait(false);
    }

    private async Task MaterializeAgentTasksAsync(
        IServiceScope scope,
        AuthorityPipelineWorkOutboxEntry entry,
        AuthorityPipelineWorkPayload payload,
        ScopeContext jobScope,
        CancellationToken cancellationToken)
    {
        IRunRepository runRepository = scope.ServiceProvider.GetRequiredService<IRunRepository>();
        IArchitectureRequestRepository requestRepository =
            scope.ServiceProvider.GetRequiredService<IArchitectureRequestRepository>();
        IEvidenceBundleRepository evidenceBundleRepository =
            scope.ServiceProvider.GetRequiredService<IEvidenceBundleRepository>();
        IAgentTaskRepository taskRepository = scope.ServiceProvider.GetRequiredService<IAgentTaskRepository>();

        string runIdN = LogSanitizer.Sanitize(entry.RunId.ToString("N"));
        RunRecord? authorityHeader = await runRepository.GetByIdAsync(jobScope, entry.RunId, cancellationToken)
            .ConfigureAwait(false);

        if (authorityHeader is null)
        {
            throw new InvalidOperationException(
                $"dbo.Runs row missing immediately after CompleteQueuedAuthorityPipelineAsync for run '{entry.RunId:N}'.");
        }

        if (string.IsNullOrWhiteSpace(authorityHeader.ArchitectureRequestId))
        {
            throw new InvalidOperationException(
                $"dbo.Runs.ArchitectureRequestId unset after deferred authority pipeline for run '{entry.RunId:N}'.");
        }

        ArchitectureRequest? architectureRequest =
            await requestRepository.GetByIdAsync(authorityHeader.ArchitectureRequestId, cancellationToken)
                .ConfigureAwait(false);

        EvidenceBundle? evidenceBundle =
            await evidenceBundleRepository.GetByIdAsync(payload.EvidenceBundleId.Trim(), cancellationToken)
                .ConfigureAwait(false);

        if (architectureRequest is null || evidenceBundle is null)
        {
            throw new InvalidOperationException(
                $"Evidence bundle / architecture request not available after deferred authority pipeline for run '{entry.RunId:N}'.");
        }

        await MergeInventoryPackagesAsync(scope, evidenceBundle, architectureRequest, jobScope, entry, cancellationToken)
            .ConfigureAwait(false);

        ScopeContext materializedScope = AmbientScopeContext.CurrentOverride ?? jobScope;

        await SeedTechnologyLedgerAsync(scope, runIdN, architectureRequest, cancellationToken).ConfigureAwait(false);

        IReadOnlyList<TechnologyLedgerEntry> ledgerEntries =
            await scope.ServiceProvider.GetRequiredService<ITechnologyLedgerRepository>()
                .GetByRunIdAsync(materializedScope, runIdN, cancellationToken)
                .ConfigureAwait(false);

        IModelExecutionProfileResolver profileResolver =
            scope.ServiceProvider.GetRequiredService<IModelExecutionProfileResolver>();

        ModelExecutionProfileResolution profileResolution =
            await profileResolver.ResolveForRunCreateAsync(architectureRequest, cancellationToken).ConfigureAwait(false);

        List<AgentTask> starterTasks = RunStarterTaskFactory.BuildStarterTasks(
            runIdN,
            evidenceBundle,
            architectureRequest,
            ledgerEntries,
            profileResolution.EffectiveProfile);

        if (!string.IsNullOrWhiteSpace(profileResolution.RequestedOverrideRaw))
        {
            await ModelExecutionProfileOverrideAuditWriter.TryLogOverrideAppliedAsync(
                scope.ServiceProvider.GetRequiredService<IAuditService>(),
                scope.ServiceProvider.GetRequiredService<IScopeContextProvider>(),
                runIdN,
                profileResolution,
                cancellationToken).ConfigureAwait(false);
        }

        IReadOnlyList<AgentTask> existingTasks =
            await taskRepository.GetByRunIdAsync(materializedScope, runIdN, cancellationToken).ConfigureAwait(false);

        if (existingTasks.Count == 0)
            await taskRepository.CreateManyAsync(starterTasks, cancellationToken).ConfigureAwait(false);

        IReadOnlyList<AgentTask> materializedTasksForLog =
            existingTasks.Count > 0 ? existingTasks : starterTasks;

        _logger.LogInformationAgentExecutionStateTransitionDeferredOutbox(
            entry.RunId,
            "post_authority_coordination",
            "agent_tasks_materialized",
            AgentExecutionStateTransitionTaskIds.Format(materializedTasksForLog),
            entry.OutboxId.ToString());

        await PatchRunLegacyStatusAsync(
            runRepository,
            scope.ServiceProvider.GetRequiredService<IRunStateTransitionService>(),
            entry,
            materializedTasksForLog,
            jobScope,
            cancellationToken).ConfigureAwait(false);
    }

    private static async Task MergeInventoryPackagesAsync(
        IServiceScope scope,
        EvidenceBundle evidenceBundle,
        ArchitectureRequest architectureRequest,
        ScopeContext jobScope,
        AuthorityPipelineWorkOutboxEntry entry,
        CancellationToken cancellationToken)
    {
        IAzureExtractorPackageRepository azureExtractorPackages =
            scope.ServiceProvider.GetRequiredService<IAzureExtractorPackageRepository>();

        ICloudInventoryExtractorPackageRepository cloudInventoryExtractorPackages =
            scope.ServiceProvider.GetRequiredService<ICloudInventoryExtractorPackageRepository>();

        IEvidenceBundleRepository evidenceBundleRepository =
            scope.ServiceProvider.GetRequiredService<IEvidenceBundleRepository>();

        if (await RunStarterInventoryEvidenceBundleMerger.MergeLinkedInventoryPackagesAsync(
                evidenceBundle,
                architectureRequest,
                jobScope,
                entry.RunId,
                azureExtractorPackages,
                cloudInventoryExtractorPackages,
                cancellationToken).ConfigureAwait(false))
        {
            await evidenceBundleRepository.UpdateAsync(evidenceBundle, cancellationToken).ConfigureAwait(false);
        }
    }

    private static async Task SeedTechnologyLedgerAsync(
        IServiceScope scope,
        string runIdN,
        ArchitectureRequest architectureRequest,
        CancellationToken cancellationToken)
    {
        TechnologyLedgerRequestSeeder requestSeeder =
            scope.ServiceProvider.GetRequiredService<TechnologyLedgerRequestSeeder>();
        TechnologyLedgerEvidenceSeeder evidenceSeeder =
            scope.ServiceProvider.GetRequiredService<TechnologyLedgerEvidenceSeeder>();
        ILogger<AuthorityPipelineExecuteWorkHandler> logger =
            scope.ServiceProvider.GetRequiredService<ILogger<AuthorityPipelineExecuteWorkHandler>>();

        await TechnologyLedgerRunCreateSeeding.TrySeedIntakeAsync(
            runIdN,
            architectureRequest,
            requestSeeder,
            evidenceSeeder,
            logger,
            cancellationToken).ConfigureAwait(false);
    }

    private async Task PatchRunLegacyStatusAsync(
        IRunRepository runRepository,
        IRunStateTransitionService runStateTransitions,
        AuthorityPipelineWorkOutboxEntry entry,
        IReadOnlyList<AgentTask> materializedTasksForLog,
        ScopeContext jobScope,
        CancellationToken cancellationToken)
    {
        RunRecord? statusPatch = await runRepository.GetByIdAsync(jobScope, entry.RunId, cancellationToken)
            .ConfigureAwait(false);

        string nextAfterMaterialize;

        if (statusPatch is null)
            nextAfterMaterialize = "run_legacy_status_patch_skipped";
        else if (string.Equals(
                     statusPatch.LegacyRunStatus,
                     nameof(ArchitectureRunStatus.TasksGenerated),
                     StringComparison.Ordinal))
            nextAfterMaterialize = "run_legacy_status_already_tasks_generated";
        else if (runStateTransitions.ShouldSkipLegacyRunStatusPatchAfterAuthorityProgress(statusPatch.ContextSnapshotId))
            nextAfterMaterialize = "run_legacy_status_skipped_authority_progress";
        else if (runStateTransitions.ShouldSetTasksGeneratedAfterDeferredMaterialize(statusPatch.LegacyRunStatus))
        {
            statusPatch.LegacyRunStatus = nameof(ArchitectureRunStatus.TasksGenerated);
            await runRepository.UpdateAsync(statusPatch, cancellationToken).ConfigureAwait(false);
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
    }
}
