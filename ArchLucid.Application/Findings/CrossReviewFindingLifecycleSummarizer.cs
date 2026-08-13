using ArchLucid.Contracts.Findings;

namespace ArchLucid.Application.Findings;

/// <summary>
///     Rolls per-finding lifecycle records into counts plus a claim-honest note (TB-2194). Kept separate from the
///     resolver so the copy can be reviewed and tested without re-deriving the states.
/// </summary>
public static class CrossReviewFindingLifecycleSummarizer
{
    private const string NoDropOutsNote =
        "No finding from the prior review dropped out, so this comparison makes no remediation claim.";

    private const string ConfirmedNote =
        "Confirmed items were recorded as remediated by a reviewer and are no longer raised. ArchLucid did not re-test the fix.";

    private const string UnverifiedNote =
        "Unverified items are simply no longer raised. Nobody recorded a remediation decision, so the drop-out is unexplained.";

    private const string AbsenceNotInformativeNote =
        "Some prior findings came from analysis that did not run in the newer review. Their absence is not evidence of a fix.";

    public static CrossReviewFindingLifecycleSummary Summarize(
        IReadOnlyList<CrossReviewFindingLifecycleRecord> records)
    {
        ArgumentNullException.ThrowIfNull(records);

        int confirmed = CountBasis(records, CrossReviewFindingResolutionBasis.ConfirmedByDisposition);
        int unverified = CountBasis(records, CrossReviewFindingResolutionBasis.Unverified);
        int notInformative = CountBasis(records, CrossReviewFindingResolutionBasis.AbsenceNotInformative);

        return new CrossReviewFindingLifecycleSummary
        {
            NewlyIdentifiedCount = CountState(records, CrossReviewFindingLifecycleState.NewlyIdentified),
            PreviouslyIdentifiedStillPresentCount =
                CountState(records, CrossReviewFindingLifecycleState.PreviouslyIdentifiedStillPresent),
            ConfirmedResolvedCount = confirmed,
            UnverifiedResolvedCount = unverified,
            AbsenceNotInformativeCount = notInformative,
            HonestyNote = BuildHonestyNote(confirmed, unverified, notInformative),
        };
    }

    private static string BuildHonestyNote(int confirmed, int unverified, int notInformative)
    {
        List<string> sentences = [];

        if (confirmed > 0)
            sentences.Add(ConfirmedNote);

        if (unverified > 0)
            sentences.Add(UnverifiedNote);

        if (notInformative > 0)
            sentences.Add(AbsenceNotInformativeNote);

        if (sentences.Count == 0)
            return NoDropOutsNote;

        return string.Join(" ", sentences);
    }

    private static int CountState(
        IReadOnlyList<CrossReviewFindingLifecycleRecord> records,
        CrossReviewFindingLifecycleState state)
    {
        return records.Count(record => record.State == state);
    }

    private static int CountBasis(
        IReadOnlyList<CrossReviewFindingLifecycleRecord> records,
        CrossReviewFindingResolutionBasis basis)
    {
        return records.Count(record => record.ResolutionBasis == basis);
    }
}
