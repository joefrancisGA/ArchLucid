using ArchLucid.Contracts.Requests;
using ArchLucid.Application.Planning;

namespace ArchLucid.Application.Drafts;

public interface IDraftRequestApplicationFacade
{
    Task<DraftArchitectureRequestResponse> DraftArchitectureRequestAsync(
        DraftArchitectureRequestInput input,
        CancellationToken cancellationToken);
}
