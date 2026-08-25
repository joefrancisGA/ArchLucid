using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Persistence.Context;
using ArchLucid.Core.Agents;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authority;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Runs;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Transactions;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Orchestration;
using ArchLucid.Application.Runs.Orchestration.Pipeline;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Runs.Orchestration;

/// <summary>
///     Legacy SQL-backed authority pipeline coordinating ingestion, knowledge graph, findings, decisioning, artifact synthesis,
///     audit, and post-commit retrieval indexing. Registered in host composition as the implementation behind the
///     application-layer <c>IAuthorityRunOrchestrator</c> port.
/// </summary>
public sealed partial class AuthorityRunOrchestrator(
    IArchLucidUnitOfWorkFactory unitOfWorkFactory,
    IScopeContextProvider scopeContextProvider,
    IAuditService auditService,
    IRunRepository runRepository,
    IAuthorityPipelineStagesExecutionDriver authorityPipelineStagesExecutionDriver,
    IAuthorityCommittedPipelineFinalizer authorityCommittedPipelineFinalizer,
    IAuthorityPipelineWorkRepository authorityPipelineWorkRepository,
    IAsyncAuthorityPipelineModeResolver asyncAuthorityPipelineModeResolver,
    IOptionsMonitor<AuthorityPipelineOptions> authorityPipelineOptions,
    ITenantAuthorityPipelineConcurrencyGate tenantAuthorityPipelineConcurrencyGate,
    IRunStateTransitionService runStateTransitionService,
    IAgentModelAliasRegistry agentModelAliasRegistry,
    ILogger<AuthorityRunOrchestrator> logger) : IAuthorityRunOrchestrator
{
    private readonly IRunRepository _runRepository =
        runRepository ?? throw new ArgumentNullException(nameof(runRepository));

    private readonly IAuthorityPipelineStagesExecutionDriver _authorityPipelineStagesExecutionDriver =
        authorityPipelineStagesExecutionDriver
        ?? throw new ArgumentNullException(nameof(authorityPipelineStagesExecutionDriver));

    private readonly IAuthorityCommittedPipelineFinalizer _authorityCommittedPipelineFinalizer =
        authorityCommittedPipelineFinalizer
        ?? throw new ArgumentNullException(nameof(authorityCommittedPipelineFinalizer));

    private readonly ITenantAuthorityPipelineConcurrencyGate _tenantAuthorityPipelineConcurrencyGate =
        tenantAuthorityPipelineConcurrencyGate
        ?? throw new ArgumentNullException(nameof(tenantAuthorityPipelineConcurrencyGate));

    private readonly IRunStateTransitionService _runStateTransitionService =
        runStateTransitionService ?? throw new ArgumentNullException(nameof(runStateTransitionService));

    private readonly IAgentModelAliasRegistry _agentModelAliasRegistry =
        agentModelAliasRegistry ?? throw new ArgumentNullException(nameof(agentModelAliasRegistry));

    /// <remarks>
    ///     Persists the run under the current <see cref="ScopeContext" />, records telemetry tags, then chooses one of two
    ///     paths: (1) <em>deferred queue</em> — when <see cref="IAsyncAuthorityPipelineModeResolver" /> requests queueing and
    ///     <paramref name="evidenceBundleIdForDeferredWork" /> is non-empty, enqueues outbox payload and returns early after
    ///     commit; or (2) <em>inline execution</em> — runs
    ///     <see cref="IAuthorityPipelineStagesExecutionDriver.ExecuteStagesAsync" /> and
    ///     <see cref="IAuthorityCommittedPipelineFinalizer.FinalizeAsync" /> in-process. Pipeline duration is bounded by
    ///     <see cref="AuthorityPipelineOptions.PipelineTimeout" /> via a linked cancellation token (timeout surfaces as
    ///     <see cref="OperationCanceledException" /> filtered against caller cancellation).
    /// </remarks>
    public async Task<RunRecord> ExecuteAsync(
        ContextIngestionRequest request,
        CancellationToken cancellationToken = default,
        string? evidenceBundleIdForDeferredWork = null,
        IArchLucidUnitOfWork? enlistUnitOfWork = null)
    {
        bool callerOwnsUnitOfWork = enlistUnitOfWork is not null;
        IArchLucidUnitOfWork uow = enlistUnitOfWork ?? await unitOfWorkFactory.CreateAsync(cancellationToken);

        try
        {
            return await ExecuteCoreAsync(
                request,
                cancellationToken,
                evidenceBundleIdForDeferredWork,
                uow,
                callerOwnsUnitOfWork);
        }
        finally
        {
            if (!callerOwnsUnitOfWork)
                await uow.DisposeAsync();
        }
    }

    private async Task SaveRunWithTransientRetryAsync(RunRecord run, IArchLucidUnitOfWork uow, CancellationToken ct)
    {
        await OrchestratorTransientDbRetry.ExecuteAsync(
            async token =>
            {
                if (uow.SupportsExternalTransaction)
                    await _runRepository.SaveAsync(run, token, uow.Connection, uow.Transaction);
                else
                    await _runRepository.SaveAsync(run, token);
            },
            ct);
    }

    private async Task CommitUnitOfWorkWithTransientRetryAsync(IArchLucidUnitOfWork uow, CancellationToken ct) =>
        await OrchestratorTransientDbRetry.ExecuteAsync(uow.CommitAsync, ct);

    private async Task EnqueueDeferredWorkWithTransientRetryAsync(
        Guid runId,
        ScopeContext scope,
        string payloadJson,
        IArchLucidUnitOfWork uow,
        CancellationToken ct) =>
        await OrchestratorTransientDbRetry.ExecuteAsync(
            async token =>
            {
                if (uow.SupportsExternalTransaction)
                {
                    await authorityPipelineWorkRepository.EnqueueAsync(
                        runId,
                        scope.TenantId,
                        scope.WorkspaceId,
                        scope.ProjectId,
                        payloadJson,
                        uow.Connection,
                        uow.Transaction,
                        token);
                }
                else
                {
                    await authorityPipelineWorkRepository.EnqueueAsync(
                        runId,
                        scope.TenantId,
                        scope.WorkspaceId,
                        scope.ProjectId,
                        payloadJson,
                        token);
                }
            },
            ct);

    private static RunRecord BuildNewRunRecord(Guid runId, ContextIngestionRequest request, ScopeContext scope)
    {
        RunRecord run = new()
        {
            RunId = runId,
            ArchitectureRequestId = request.ArchitectureRequestId,
            ProjectId = request.ProjectId,
            Description = request.Description,
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            StructuralExecutionMode = StructuralExecutionMode.Simulator
        };
        ApplyScope(run, scope);

        return run;
    }

    private static void ApplyScope(RunRecord run, ScopeContext scope)
    {
        run.TenantId = scope.TenantId;
        run.WorkspaceId = scope.WorkspaceId;
        run.ScopeProjectId = scope.ProjectId;
    }

    private void LogAgentExecutionStateTransition(Guid runId, string currentState, string nextState, string taskIds)
    {
        logger.LogInformationAgentExecutionStateTransition(runId, currentState, nextState, taskIds);
        ArchLucidInstrumentation.RecordOrchestratorStateTransition(runId, currentState, nextState);
    }
}
