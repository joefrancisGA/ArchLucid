using ArchLucid.Contracts.Findings;

namespace ArchLucid.Application.Findings;

/// <summary>
///     Renders the TB-2194 lifecycle summary as plain "Label: value" lines so every export format (markdown, HTML, and
///     any future profile) states the same counts and the same honesty qualifier.
/// </summary>
public static class CrossReviewFindingLifecycleExportLines
{
    public static IReadOnlyList<string> Build(CrossReviewFindingLifecycleSummary summary)
    {
        ArgumentNullException.ThrowIfNull(summary);

        return
        [
            $"Newly identified findings: {summary.NewlyIdentifiedCount}",
            $"Previously identified, still present: {summary.PreviouslyIdentifiedStillPresentCount}",
            $"Confirmed remediated by a recorded decision: {summary.ConfirmedResolvedCount}",
            $"No longer raised, no remediation decision recorded: {summary.UnverifiedResolvedCount}",
            $"No longer raised, absence not informative: {summary.AbsenceNotInformativeCount}",
            $"Finding lifecycle honesty: {summary.HonestyNote}",
        ];
    }
}
