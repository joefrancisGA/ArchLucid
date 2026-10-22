using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Persistence.TechnologyLedger;

namespace ArchLucid.Application.ArchitectureIntelligence;

public interface IMustNotFailEnforcer
{
    IReadOnlyList<MustNotFailViolation> Evaluate(
        IReadOnlyList<SpecialistReviewFinding> findings,
        IReadOnlyList<ArchitectureRecommendation> recommendations);

    IReadOnlyList<MustNotFailViolation> Evaluate(
        IReadOnlyList<SpecialistReviewFinding> findings,
        IReadOnlyList<ArchitectureRecommendation> recommendations,
        IReadOnlyList<TechnologyLedgerEntry>? ledgerEntries);
}
