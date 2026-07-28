using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

public interface IAdversarialReviewService
{
    AdversarialReviewResult Review(IReadOnlyList<SpecialistReviewFinding> findings);
}
