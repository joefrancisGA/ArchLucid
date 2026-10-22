using ArchLucid.Contracts.Findings;

namespace ArchLucid.Application.Findings;

/// <inheritdoc cref="ICrossReviewFindingCorrelationService" />
public sealed class CrossReviewFindingCorrelationService : ICrossReviewFindingCorrelationService
{
    /// <inheritdoc />
    public CrossReviewFindingCorrelationResult Correlate(
        IReadOnlyList<ArchitectureFinding> leftFindings,
        IReadOnlyList<ArchitectureFinding> rightFindings)
    {
        ArgumentNullException.ThrowIfNull(leftFindings);
        ArgumentNullException.ThrowIfNull(rightFindings);

        CrossReviewFindingCorrelationResult result = new();
        HashSet<string> matchedRightIds = new(StringComparer.OrdinalIgnoreCase);
        HashSet<string> matchedLeftIds = new(StringComparer.OrdinalIgnoreCase);

        Dictionary<string, Queue<ArchitectureFinding>> rightByDedupeKey = BuildDedupeIndex(rightFindings);
        Dictionary<string, Queue<ArchitectureFinding>> rightByFuzzyKey = BuildFuzzyIndex(rightFindings);

        foreach (ArchitectureFinding leftFinding in leftFindings)
        {
            if (string.IsNullOrWhiteSpace(leftFinding.FindingId))
                continue;

            string? dedupeKey = NormalizedFindingFingerprintNormalizer.TryBuildDedupeKey(leftFinding);

            if (dedupeKey is not null
                && rightByDedupeKey.TryGetValue(dedupeKey, out Queue<ArchitectureFinding>? policyQueue)
                && TryDequeueUnmatched(policyQueue, matchedRightIds, out ArchitectureFinding? rightMatch))
            {
                AddPair(result, leftFinding, rightMatch, FindingCorrelationMethod.PolicyRuleAndFingerprint, dedupeKey);
                matchedLeftIds.Add(leftFinding.FindingId);
                matchedRightIds.Add(rightMatch.FindingId);

                continue;
            }

            string fuzzyKey = NormalizedFindingFingerprintNormalizer.NormalizeFuzzyKey(leftFinding);

            if (rightByFuzzyKey.TryGetValue(fuzzyKey, out Queue<ArchitectureFinding>? fuzzyQueue)
                && TryDequeueUnmatched(fuzzyQueue, matchedRightIds, out ArchitectureFinding? fuzzyMatch))
            {
                string pairDedupeKey = dedupeKey ?? fuzzyKey;
                AddPair(result, leftFinding, fuzzyMatch, FindingCorrelationMethod.MessageCategoryFuzzy, pairDedupeKey);
                matchedLeftIds.Add(leftFinding.FindingId);
                matchedRightIds.Add(fuzzyMatch.FindingId);
            }
        }

        foreach (ArchitectureFinding leftFinding in leftFindings)
        {
            if (string.IsNullOrWhiteSpace(leftFinding.FindingId))
                continue;

            if (!matchedLeftIds.Contains(leftFinding.FindingId))
                result.UnmatchedLeftFindingIds.Add(leftFinding.FindingId);
        }

        foreach (ArchitectureFinding rightFinding in rightFindings)
        {
            if (string.IsNullOrWhiteSpace(rightFinding.FindingId))
                continue;

            if (!matchedRightIds.Contains(rightFinding.FindingId))
                result.UnmatchedRightFindingIds.Add(rightFinding.FindingId);
        }

        result.PolicyRuleMatchCount = result.MatchedPairs.Count(pair =>
            pair.Method == FindingCorrelationMethod.PolicyRuleAndFingerprint);

        result.FuzzyMatchCount = result.MatchedPairs.Count(pair =>
            pair.Method == FindingCorrelationMethod.MessageCategoryFuzzy);

        return result;
    }

    private static Dictionary<string, Queue<ArchitectureFinding>> BuildDedupeIndex(
        IReadOnlyList<ArchitectureFinding> findings)
    {
        Dictionary<string, Queue<ArchitectureFinding>> index = new(StringComparer.OrdinalIgnoreCase);

        foreach (ArchitectureFinding finding in findings)
        {
            string? dedupeKey = NormalizedFindingFingerprintNormalizer.TryBuildDedupeKey(finding);

            if (dedupeKey is null)
                continue;

            if (!index.TryGetValue(dedupeKey, out Queue<ArchitectureFinding>? queue))
            {
                queue = new Queue<ArchitectureFinding>();
                index[dedupeKey] = queue;
            }

            queue.Enqueue(finding);
        }

        return index;
    }

    private static Dictionary<string, Queue<ArchitectureFinding>> BuildFuzzyIndex(
        IReadOnlyList<ArchitectureFinding> findings)
    {
        Dictionary<string, Queue<ArchitectureFinding>> index = new(StringComparer.OrdinalIgnoreCase);

        foreach (ArchitectureFinding finding in findings)
        {
            string fuzzyKey = NormalizedFindingFingerprintNormalizer.NormalizeFuzzyKey(finding);

            if (!index.TryGetValue(fuzzyKey, out Queue<ArchitectureFinding>? queue))
            {
                queue = new Queue<ArchitectureFinding>();
                index[fuzzyKey] = queue;
            }

            queue.Enqueue(finding);
        }

        return index;
    }

    private static bool TryDequeueUnmatched(
        Queue<ArchitectureFinding> queue,
        HashSet<string> matchedRightIds,
        out ArchitectureFinding match)
    {
        while (queue.Count > 0)
        {
            ArchitectureFinding candidate = queue.Dequeue();

            if (string.IsNullOrWhiteSpace(candidate.FindingId))
                continue;

            if (matchedRightIds.Contains(candidate.FindingId))
                continue;

            match = candidate;

            return true;
        }

        match = null!;

        return false;
    }

    private static void AddPair(
        CrossReviewFindingCorrelationResult result,
        ArchitectureFinding leftFinding,
        ArchitectureFinding rightFinding,
        FindingCorrelationMethod method,
        string dedupeKey)
    {
        result.MatchedPairs.Add(
            new FindingCorrelationPair
            {
                LeftFindingId = leftFinding.FindingId,
                RightFindingId = rightFinding.FindingId,
                Method = method,
                DedupeKey = dedupeKey,
            });
    }
}
