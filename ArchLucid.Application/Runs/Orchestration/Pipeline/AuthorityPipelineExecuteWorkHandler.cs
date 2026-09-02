using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Coordination;
using ArchLucid.ContextIngestion.Models;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Scoping;
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

    public bool CanHandle(AuthorityPipelineWorkPayload payload) =>
        payload.WorkKind == AuthorityPipelineWorkKind.Execute && payload.IsValidForProcessing();

    public async Task HandleAsync(
        AuthorityPipelineWorkOutboxEntry entry,
        AuthorityPipelineWorkPayload payload,
        CancellationToken cancellationToken)
    {
        using IServiceScope scope = _scopeFactory.CreateScope();
        ScopeContext jobScope = AuthorityPipelineWorkHandlerCore.CreateJobScope(entry);
        using IDisposable _ = AuthorityPipelineWorkHandlerCore.PushJobScope(jobScope);

        RunRecord persistedRun = await AuthorityPipelineWorkHandlerCore
            .LoadPersistedRunAsync(scope, jobScope, entry, cancellationToken)
            .ConfigureAwait(false);

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

        await AuthorityPipelineMaterializeWork.MaterializeAgentTasksAsync(
            scope,
            entry,
            payload,
            jobScope,
            _logger,
            cancellationToken).ConfigureAwait(false);
    }
}
