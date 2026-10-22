using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Persistence.Orchestration;

namespace ArchLucid.Application.Runs.Orchestration.Pipeline;

public enum AuthorityPipelineWorkKind
{
    Execute,
    Commit,
    Extractor,
}

public interface IAuthorityPipelineWorkHandler
{
    AuthorityPipelineWorkKind Kind { get; }

    bool CanHandle(AuthorityPipelineWorkPayload payload);

    Task HandleAsync(
        AuthorityPipelineWorkOutboxEntry entry,
        AuthorityPipelineWorkPayload payload,
        CancellationToken cancellationToken);
}
