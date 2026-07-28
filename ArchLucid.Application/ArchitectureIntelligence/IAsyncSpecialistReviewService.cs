using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

public interface IAsyncSpecialistReviewService
{
    Task<SpecialistReviewResult> ReviewAsync(
        ArchitectureKnowledgeModel model,
        IReadOnlyList<QualityDimension>? dimensions = null,
        CancellationToken cancellationToken = default);
}
