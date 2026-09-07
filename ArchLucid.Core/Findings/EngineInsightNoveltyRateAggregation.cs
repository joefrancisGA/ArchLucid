using ArchLucid.Contracts.Findings;

namespace ArchLucid.Core.Findings;

/// <summary>Groups decision-grade emissions and novelty signals by engine type (DX-23).</summary>
public static class EngineInsightNoveltyRateAggregation
{
    public static IReadOnlyList<EngineInsightNoveltyRateRow> BuildRows(
        IEnumerable<DecisionGradeEmission> emissions,
        IEnumerable<NoveltySignalRef> noveltySignals)
    {
        ArgumentNullException.ThrowIfNull(emissions);
        ArgumentNullException.ThrowIfNull(noveltySignals);

        HashSet<(Guid RunId, string FindingId)> noveltyKeys = noveltySignals
            .Select(static signal => (signal.RunId, signal.FindingId))
            .ToHashSet();

        Dictionary<string, (int DecisionGradeCount, int DidNotThinkOfThatCount)> counts =
            new(StringComparer.OrdinalIgnoreCase);

        foreach (DecisionGradeEmission emission in emissions)
        {
            if (!counts.TryGetValue(emission.EngineType, out (int DecisionGradeCount, int DidNotThinkOfThatCount) bucket))
            {
                bucket = (0, 0);
            }

            bucket.DecisionGradeCount++;

            if (noveltyKeys.Contains((emission.RunId, emission.FindingId)))
            {
                bucket.DidNotThinkOfThatCount++;
            }

            counts[emission.EngineType] = bucket;
        }

        return counts
            .OrderBy(static pair => pair.Key, StringComparer.Ordinal)
            .Select(static pair => new EngineInsightNoveltyRateRow
            {
                EngineType = pair.Key,
                DecisionGradeCount = pair.Value.DecisionGradeCount,
                DidNotThinkOfThatCount = pair.Value.DidNotThinkOfThatCount,
                Rate = EngineInsightNoveltyRateCalculator.ComputeRate(
                    pair.Value.DecisionGradeCount,
                    pair.Value.DidNotThinkOfThatCount),
            })
            .ToList();
    }

    public sealed record DecisionGradeEmission(Guid RunId, string FindingId, string EngineType);

    public sealed record NoveltySignalRef(Guid RunId, string FindingId);
}
