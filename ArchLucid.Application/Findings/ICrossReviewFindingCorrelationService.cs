using ArchLucid.Contracts.Findings;

namespace ArchLucid.Application.Findings;

/// <summary>
///     Correlates findings across two committed runs using policy-rule fingerprints and fuzzy category/message fallback.
/// </summary>
public interface ICrossReviewFindingCorrelationService
{
    CrossReviewFindingCorrelationResult Correlate(
        IReadOnlyList<ArchitectureFinding> leftFindings,
        IReadOnlyList<ArchitectureFinding> rightFindings);
}
