using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

public interface ISpecialistReviewService
{
    SpecialistReviewResult Review(
        ArchitectureKnowledgeModel model,
        IReadOnlyList<QualityDimension>? dimensions = null);
}
