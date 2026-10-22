using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Orchestration;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Runs.Orchestration.Pipeline;

/// <summary>
///     Commit-phase deferred authority pipeline work: materialize starter agent tasks and patch legacy status.
/// </summary>
public sealed class AuthorityPipelineCommitWorkHandler(
    IServiceScopeFactory scopeFactory,
    ILogger<AuthorityPipelineCommitWorkHandler> logger) : IAuthorityPipelineWorkHandler
{
    private readonly IServiceScopeFactory _scopeFactory =
        scopeFactory ?? throw new ArgumentNullException(nameof(scopeFactory));

    private readonly ILogger<AuthorityPipelineCommitWorkHandler> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    public AuthorityPipelineWorkKind Kind => AuthorityPipelineWorkKind.Commit;

    public bool CanHandle(AuthorityPipelineWorkPayload payload) =>
        payload.WorkKind == AuthorityPipelineWorkKind.Commit && payload.IsValidForProcessing();

    public async Task HandleAsync(
        AuthorityPipelineWorkOutboxEntry entry,
        AuthorityPipelineWorkPayload payload,
        CancellationToken cancellationToken)
    {
        using IServiceScope scope = _scopeFactory.CreateScope();
        ScopeContext jobScope = AuthorityPipelineWorkHandlerCore.CreateJobScope(entry);
        using IDisposable _ = AuthorityPipelineWorkHandlerCore.PushJobScope(jobScope);

        await AuthorityPipelineWorkHandlerCore
            .LoadPersistedRunAsync(scope, jobScope, entry, cancellationToken)
            .ConfigureAwait(false);

        await AuthorityPipelineMaterializeWork.MaterializeAgentTasksAsync(
            scope,
            entry,
            payload,
            jobScope,
            _logger,
            cancellationToken).ConfigureAwait(false);
    }
}
