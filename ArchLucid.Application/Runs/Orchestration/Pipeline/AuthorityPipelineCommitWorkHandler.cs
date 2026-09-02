using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Persistence.Orchestration;

namespace ArchLucid.Application.Runs.Orchestration.Pipeline;

/// <summary>Reserved handler for future commit-phase deferred authority pipeline work.</summary>
public sealed class AuthorityPipelineCommitWorkHandler : IAuthorityPipelineWorkHandler
{
    public AuthorityPipelineWorkKind Kind => AuthorityPipelineWorkKind.Commit;

    public bool CanHandle(AuthorityPipelineWorkPayload payload) => false;

    public Task HandleAsync(
        AuthorityPipelineWorkOutboxEntry entry,
        AuthorityPipelineWorkPayload payload,
        CancellationToken cancellationToken) =>
        throw new NotSupportedException("Commit-phase authority pipeline outbox work is not yet implemented.");
}
