using ArchLucid.Contracts.Requests;

namespace ArchLucid.Application.Planning;

public interface IArchitectureOverviewRewriteService
{
    Task<RewriteArchitectureOverviewResponse> RewriteAsync(
        RewriteArchitectureOverviewInput input,
        CancellationToken cancellationToken);
}
