using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

public interface IIncrementalReReviewService
{
    IncrementalReReviewResult ReReview(
        ArchitectureKnowledgeModel model,
        ReReviewScope scope,
        ISpecialistReviewService specialistService);

    Task<IncrementalReReviewResult> ReReviewAsync(
        ArchitectureKnowledgeModel model,
        ReReviewScope scope,
        IAsyncSpecialistReviewService specialistService,
        CancellationToken cancellationToken = default);
}
