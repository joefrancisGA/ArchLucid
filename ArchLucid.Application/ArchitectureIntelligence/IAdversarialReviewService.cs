using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

public interface IAdversarialReviewService
{
    AdversarialReviewResult Review(IReadOnlyList<SpecialistReviewFinding> findings);

    /// <summary>
    /// Two-lane split using TB-1981 integrity-passed finding ids when provided.
    /// When <paramref name="integrityPassedFindingIds"/> is null, falls back to artifact-id presence.
    /// </summary>
    AdversarialReviewResult Review(
        IReadOnlyList<SpecialistReviewFinding> findings,
        IReadOnlySet<string>? integrityPassedFindingIds);

    IReadOnlyList<string> ToOpenQuestions(AdversarialReviewResult adversarialResult);
}
