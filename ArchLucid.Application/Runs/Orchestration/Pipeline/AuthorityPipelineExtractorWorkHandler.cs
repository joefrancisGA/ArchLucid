using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Orchestration;

using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Application.Runs.Orchestration.Pipeline;

/// <summary>
///     Extractor-phase deferred authority pipeline work: merge linked inventory packages into the evidence bundle.
/// </summary>
public sealed class AuthorityPipelineExtractorWorkHandler(IServiceScopeFactory scopeFactory) : IAuthorityPipelineWorkHandler
{
    private readonly IServiceScopeFactory _scopeFactory =
        scopeFactory ?? throw new ArgumentNullException(nameof(scopeFactory));

    public AuthorityPipelineWorkKind Kind => AuthorityPipelineWorkKind.Extractor;

    public bool CanHandle(AuthorityPipelineWorkPayload payload) =>
        payload.WorkKind == AuthorityPipelineWorkKind.Extractor && payload.IsValidForProcessing();

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

        await AuthorityPipelineMaterializeWork.MergeInventoryPackagesOnlyAsync(
            scope,
            entry,
            payload,
            jobScope,
            cancellationToken).ConfigureAwait(false);
    }
}
