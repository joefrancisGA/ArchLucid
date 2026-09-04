using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Governance;

namespace ArchLucid.Application.Runs.Orchestration.Commit;

/// <summary>
/// Blocks manifest commit when required intake questions were skipped (LD-04 / LI-04 parity with UI scorecard).
/// </summary>
public static class AuthorityCommitSkippedMustGate
{
    public static PreCommitGateResult? Evaluate(TransparencyTrail? trail)
    {
        if (trail is null)
        {
            return null;
        }

        int skippedMustCount = CountSkippedMustQuestions(trail);

        if (skippedMustCount <= 0)
        {
            return null;
        }

        string noun = skippedMustCount == 1 ? "question is" : "questions are";

        return new PreCommitGateResult
        {
            Blocked = true,
            Reason = $"{skippedMustCount} required {noun} unanswered.",
        };
    }

    internal static int CountSkippedMustQuestions(TransparencyTrail trail)
    {
        ArgumentNullException.ThrowIfNull(trail);

        int count = 0;

        foreach (SkippedQuestionTrailEntry skipped in trail.Skipped)
        {
            if (skipped.Tier != ElicitationQuestionTier.Must)
            {
                continue;
            }

            if (string.IsNullOrWhiteSpace(skipped.QuestionKey))
            {
                continue;
            }

            count++;
        }

        return count;
    }
}
