using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

public interface IAsyncAdversarialReviewService
{
    Task<AdversarialReviewResult> ReviewAsync(
        IReadOnlyList<SpecialistReviewFinding> findings,
        IReadOnlySet<string>? integrityPassedFindingIds = null,
        CancellationToken cancellationToken = default);

    IReadOnlyList<string> ToOpenQuestions(AdversarialReviewResult adversarialResult);
}
