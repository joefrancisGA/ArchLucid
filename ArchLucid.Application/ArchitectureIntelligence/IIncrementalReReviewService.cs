using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

public interface IIncrementalReReviewService
{
    Task<IncrementalReReviewResult> ReReviewAsync(
        ArchitectureKnowledgeModel model,
        ReReviewScope scope,
        IAsyncSpecialistReviewService specialistService,
        CancellationToken cancellationToken = default);
}
