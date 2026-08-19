using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

public interface IMustNotFailEnforcer
{
    IReadOnlyList<MustNotFailViolation> Evaluate(
        IReadOnlyList<SpecialistReviewFinding> findings,
        IReadOnlyList<ArchitectureRecommendation> recommendations);
}
