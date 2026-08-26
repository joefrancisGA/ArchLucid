using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Findings;

namespace ArchLucid.Decisioning.Findings;

/// <summary>
///     Measures insight-density scores per engine without changing demotion behavior.
/// </summary>
/// <remarks>
///     <para>
///         <strong>claimBoundary:</strong> Advisory-only. Typed-engine findings are never demoted —
///         <see cref="DeterministicInsightDensityGate" /> short-circuits with penalty reason
///         <c>typed-engine-protected</c>. Distribution rows report computed scores and
///         <see cref="InsightDensityEngineDistributionRow.WouldDemoteIfUnprotectedCount" /> as a
///         counterfactual, not production behavior.
///     </para>
///     <para>
///         The golden corpus harness exercises six engines; thirty-three built-in engines are absent
///         from a corpus-derived distribution table.
///     </para>
/// </remarks>
public static class InsightDensityEngineDistributionCalculator
{
    public static InsightDensityEngineDistribution Calculate(
        FindingsSnapshot snapshot,
        IInsightDensityGate gate,
        InsightDensityGateOptions options)
    {
        ArgumentNullException.ThrowIfNull(snapshot);
        ArgumentNullException.ThrowIfNull(gate);
        ArgumentNullException.ThrowIfNull(options);

        if (snapshot.Findings.Count == 0)
        {
            return new InsightDensityEngineDistribution();
        }

        List<InsightDensityGateCandidate> candidates = snapshot.Findings
            .Select(InsightDensityGateCandidate.FromFinding)
            .ToList();

        Dictionary<string, List<int>> scoresByEngine = new(StringComparer.OrdinalIgnoreCase);

        foreach (Finding finding in snapshot.Findings)
        {
            InsightDensityGateCandidate candidate = InsightDensityGateCandidate.FromFinding(finding);
            InsightDensityGateResult result = gate.Score(candidate, candidates);

            if (!scoresByEngine.TryGetValue(finding.EngineType, out List<int>? bucket))
            {
                bucket = [];
                scoresByEngine[finding.EngineType] = bucket;
            }

            bucket.Add(result.InsightDensityScore);
        }

        List<InsightDensityEngineDistributionRow> rows = scoresByEngine
            .OrderBy(static pair => pair.Key, StringComparer.OrdinalIgnoreCase)
            .Select(pair => BuildRow(pair.Key, pair.Value, options.DemotionThreshold))
            .ToList();

        return new InsightDensityEngineDistribution { Rows = rows };
    }

    private static InsightDensityEngineDistributionRow BuildRow(
        string engineType,
        List<int> scores,
        int demotionThreshold)
    {
        List<int> sortedScores = scores.OrderBy(static score => score).ToList();
        int findingCount = sortedScores.Count;
        int minScore = sortedScores[0];
        int maxScore = sortedScores[findingCount - 1];
        int medianScore = ComputeMedian(sortedScores);
        int wouldDemoteCount = sortedScores.Count(score => score < demotionThreshold);

        return new InsightDensityEngineDistributionRow
        {
            EngineType = engineType,
            FindingCount = findingCount,
            MinScore = minScore,
            MedianScore = medianScore,
            MaxScore = maxScore,
            WouldDemoteIfUnprotectedCount = wouldDemoteCount,
        };
    }

    private static int ComputeMedian(List<int> sortedScores)
    {
        int count = sortedScores.Count;
        int middleIndex = count / 2;

        if (count % 2 == 1)
        {
            return sortedScores[middleIndex];
        }

        int lower = sortedScores[middleIndex - 1];
        int upper = sortedScores[middleIndex];

        return (lower + upper) / 2;
    }
}
