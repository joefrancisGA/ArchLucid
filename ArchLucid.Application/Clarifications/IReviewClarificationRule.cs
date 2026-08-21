using ArchLucid.Contracts.Clarifications;
using ArchLucid.Contracts.Findings;

namespace ArchLucid.Application.Clarifications;

/// <summary>Derives clarification questions from a single finding type.</summary>
public interface IReviewClarificationRule
{
    string SupportedFindingType { get; }

    IEnumerable<ReviewClarificationQuestion> Derive(Finding finding);
}
