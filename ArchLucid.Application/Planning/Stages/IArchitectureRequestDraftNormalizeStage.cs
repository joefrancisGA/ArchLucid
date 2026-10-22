using ArchLucid.Application.Planning.AdvisoryDraft;
using ArchLucid.Contracts.Requests;

namespace ArchLucid.Application.Planning.Stages;

public interface IArchitectureRequestDraftNormalizeStage
{
    Task<DraftArchitectureRequestResponse> NormalizeAsync(
        DraftArchitectureRequestInput input,
        ArchitectureRequestDraftExtractionResult extraction,
        IArchitectureRequestDraftProgress? progress,
        CancellationToken cancellationToken);
}
