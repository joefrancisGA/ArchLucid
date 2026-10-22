using ArchLucid.Contracts.Requests;
using ArchLucid.Application.Planning;

namespace ArchLucid.Application.Drafts;

public sealed class DraftRequestApplicationFacade(
    IArchitectureRequestDraftService architectureRequestDraftService) : IDraftRequestApplicationFacade
{
    private readonly IArchitectureRequestDraftService _architectureRequestDraftService =
        architectureRequestDraftService ?? throw new ArgumentNullException(nameof(architectureRequestDraftService));

    public Task<DraftArchitectureRequestResponse> DraftArchitectureRequestAsync(
        DraftArchitectureRequestInput input,
        CancellationToken cancellationToken) =>
        _architectureRequestDraftService.DraftAsync(input, cancellationToken);
}
