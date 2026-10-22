namespace ArchLucid.Application.Runs.Orchestration.Commit;

/// <summary>Canonical skipped-MUST blocked reason shared by API, CLI, and UI scorecard (WA-12).</summary>
public static class AuthorityCommitSkippedMustBlockedReason
{
    public static string Format(int skippedMustCount)
    {
        if (skippedMustCount <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(skippedMustCount));
        }

        string noun = skippedMustCount == 1 ? "question is" : "questions are";

        return $"{skippedMustCount} required {noun} unanswered.";
    }
}
