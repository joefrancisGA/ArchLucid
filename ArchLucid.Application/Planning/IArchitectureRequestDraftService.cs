using ArchLucid.Application.Planning.AdvisoryDraft;
using ArchLucid.Contracts.Requests;

namespace ArchLucid.Application.Planning;

public interface IArchitectureRequestDraftService
{
    Task<DraftArchitectureRequestResponse> DraftAsync(
        DraftArchitectureRequestInput input,
        CancellationToken cancellationToken,
        IArchitectureRequestDraftProgress? progress = null);
}
