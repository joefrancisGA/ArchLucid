using ArchLucid.Contracts.Requests;

namespace ArchLucid.Application.Planning;

public interface IArchitectureRequestDraftService
{
    Task<DraftArchitectureRequestResponse> DraftAsync(DraftArchitectureRequestInput input, CancellationToken cancellationToken);
}
