using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Persistence.Orchestration;

namespace ArchLucid.Application.Runs.Orchestration.Pipeline;

/// <summary>Reserved handler for future extractor-phase deferred authority pipeline work.</summary>
public sealed class AuthorityPipelineExtractorWorkHandler : IAuthorityPipelineWorkHandler
{
    public AuthorityPipelineWorkKind Kind => AuthorityPipelineWorkKind.Extractor;

    public bool CanHandle(AuthorityPipelineWorkPayload payload) => false;

    public Task HandleAsync(
        AuthorityPipelineWorkOutboxEntry entry,
        AuthorityPipelineWorkPayload payload,
        CancellationToken cancellationToken) =>
        throw new NotSupportedException("Extractor-phase authority pipeline outbox work is not yet implemented.");
}
