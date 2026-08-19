using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

/// <summary>Operator-facing combined finding status text (TB-1985 — risk accepted must not read as pass).</summary>
public static class SpecialistReviewFindingStatusFormatter
{
    public static string FormatOperatorStatus(ReviewConclusion conclusion, GovernanceDisposition disposition)
    {
        if (disposition is GovernanceDisposition.Accepted
            && conclusion is ReviewConclusion.Fail or ReviewConclusion.Indeterminate)
        {
            return conclusion switch
            {
                ReviewConclusion.Fail => "Failed — risk accepted",
                ReviewConclusion.Indeterminate => "Indeterminate — risk accepted",
                _ => FormatConclusionOnly(conclusion),
            };
        }

        if (disposition is not GovernanceDisposition.Open)
            return $"{FormatConclusionOnly(conclusion)} ({FormatDisposition(disposition)})";

        return FormatConclusionOnly(conclusion);
    }

    public static bool ReadsAsPass(string operatorStatus) =>
        operatorStatus.Equals("Pass", StringComparison.OrdinalIgnoreCase)
        || operatorStatus.StartsWith("Pass ", StringComparison.OrdinalIgnoreCase)
        || operatorStatus.EndsWith(" pass", StringComparison.OrdinalIgnoreCase);

    private static string FormatConclusionOnly(ReviewConclusion conclusion) =>
        conclusion switch
        {
            ReviewConclusion.Pass => "Pass",
            ReviewConclusion.Fail => "Fail",
            ReviewConclusion.Indeterminate => "Indeterminate",
            ReviewConclusion.NotApplicable => "Not applicable",
            _ => conclusion.ToString(),
        };

    private static string FormatDisposition(GovernanceDisposition disposition) =>
        disposition switch
        {
            GovernanceDisposition.Open => "open",
            GovernanceDisposition.Accepted => "risk accepted",
            GovernanceDisposition.RemediationPlanned => "remediation planned",
            GovernanceDisposition.Deferred => "deferred",
            GovernanceDisposition.ExceptionGranted => "exception granted",
            GovernanceDisposition.HumanDecisionRequired => "human decision required",
            _ => disposition.ToString(),
        };
}
