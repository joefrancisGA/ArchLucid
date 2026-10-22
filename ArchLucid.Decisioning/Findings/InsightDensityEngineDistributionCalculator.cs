using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Findings;

namespace ArchLucid.Decisioning.Findings;

/// <summary>
///     Measures insight-density scores per engine without changing demotion behavior.
/// </summary>
/// <remarks>
///     <para>
///         <strong>claimBoundary:</strong> Per ADR 0070, typed-engine findings follow the same demotion
///         predicate as agent findings. Distribution rows report computed scores,
///         <see cref="InsightDensityEngineDistributionRow.WouldDemoteIfUnprotectedCount" /> at the live
///         <see cref="InsightDensityGateOptions.DemotionThreshold" />, and advisory
///         <see cref="InsightDensityEngineDistributionRow.WouldDemoteAt65Count" /> for threshold tuning.
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
        InsightDensityGateOptions options,
        GraphSnapshot? graphSnapshot = null)
    {
        ArgumentNullException.ThrowIfNull(snapshot);
        ArgumentNullException.ThrowIfNull(gate);
        ArgumentNullException.ThrowIfNull(options);

        IInsightDensityGate scoringGate = InsightDensityGateScoringFactory.CreateScoringGate(
            gate,
            options,
            graphSnapshot);

        if (snapshot.Findings.Count == 0)
        {
            return new InsightDensityEngineDistribution();
        }

        List<InsightDensityGateCandidate> candidates = snapshot.Findings
            .Select(InsightDensityGateCandidate.FromFinding)
            .ToList();

        Dictionary<string, InsightDensityEngineDistributionAccumulator> accumulators =
            new(StringComparer.OrdinalIgnoreCase);

        foreach (Finding finding in snapshot.Findings)
        {
            InsightDensityGateCandidate candidate = InsightDensityGateCandidate.FromFinding(finding);
            InsightDensityGateResult result = scoringGate.Score(candidate, candidates);

            if (!accumulators.TryGetValue(finding.EngineType, out InsightDensityEngineDistributionAccumulator? accumulator))
            {
                accumulator = new InsightDensityEngineDistributionAccumulator();
                accumulators[finding.EngineType] = accumulator;
            }

            accumulator.AddFinding(result, candidate, options.DemotionThreshold);
        }

        List<InsightDensityEngineDistributionRow> rows = accumulators
            .OrderBy(static pair => pair.Key, StringComparer.OrdinalIgnoreCase)
            .Select(static pair => pair.Value.ToRow(pair.Key))
            .ToList();

        return new InsightDensityEngineDistribution { Rows = rows };
    }
}
