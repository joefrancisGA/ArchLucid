using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

public interface IAdversarialReviewService
{
    AdversarialReviewResult Review(IReadOnlyList<SpecialistReviewFinding> findings);

    /// <summary>
    /// Only findings that the caller supplies as substantiated can enter that lane.
    /// When <paramref name="integrityPassedFindingIds"/> is null, findings remain candidates for challenge.
    /// </summary>
    AdversarialReviewResult Review(
        IReadOnlyList<SpecialistReviewFinding> findings,
        IReadOnlySet<string>? integrityPassedFindingIds);

    IReadOnlyList<string> ToOpenQuestions(AdversarialReviewResult adversarialResult);
}
