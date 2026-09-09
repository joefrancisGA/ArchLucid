using ArchLucid.Contracts.Findings;

namespace ArchLucid.Application.Findings.FindingVerification;

public interface IFindingVerificationScorer
{
    (FindingVerificationStatus Status, string TraceText) Score(
        Finding sourceFinding,
        FindingVerificationScoringContext context);
}
