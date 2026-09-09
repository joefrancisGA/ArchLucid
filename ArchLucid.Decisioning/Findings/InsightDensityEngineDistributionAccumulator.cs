using ArchLucid.Core.Findings;

namespace ArchLucid.Decisioning.Findings;

/// <summary>Per-engine rollup bucket while scanning snapshot findings.</summary>
public sealed class InsightDensityEngineDistributionAccumulator
{
    private readonly List<int> _scores = [];

    public int GenericAdviceCount
    {
        get;
        private set;
    }

    public int NoConcreteEvidenceCount
    {
        get;
        private set;
    }

    public int NoArchitectureAnchorCount
    {
        get;
        private set;
    }

    public int DuplicationCount
    {
        get;
        private set;
    }

    public int WouldDemoteIfUnprotectedCount
    {
        get;
        private set;
    }

    public int WouldDemoteAt65Count
    {
        get;
        private set;
    }

    public void AddFinding(
        InsightDensityGateResult result,
        InsightDensityGateCandidate candidate,
        int demotionThreshold)
    {
        ArgumentNullException.ThrowIfNull(result);
        ArgumentNullException.ThrowIfNull(candidate);

        _scores.Add(result.InsightDensityScore);

        IReadOnlyList<string> penaltyReasons = result.PenaltyReasons;

        if (penaltyReasons.Contains("generic-advice", StringComparer.Ordinal))
        {
            GenericAdviceCount++;
        }

        if (penaltyReasons.Contains("no-concrete-evidence", StringComparer.Ordinal))
        {
            NoConcreteEvidenceCount++;
        }

        if (penaltyReasons.Contains("no-architecture-anchor", StringComparer.Ordinal))
        {
            NoArchitectureAnchorCount++;
        }

        if (penaltyReasons.Contains("high-duplication", StringComparer.Ordinal)
            || penaltyReasons.Contains("moderate-duplication", StringComparer.Ordinal))
        {
            DuplicationCount++;
        }

        bool hasConcreteEvidence = GenericArchitectureAdvicePatterns.HasConcreteEvidenceCitation(candidate.EvidenceRefs);
        bool isGenericAdvice = GenericArchitectureAdvicePatterns.IsObviousGenericAdvice(candidate.Message);
        bool hasFalsifiabilitySignal = GenericArchitectureAdvicePatterns.HasFalsifiabilitySignal(candidate.Message);

        if (InsightDensityDemotionPredicate.ShouldDemote(
                result.InsightDensityScore,
                demotionThreshold,
                isGenericAdvice,
                hasFalsifiabilitySignal,
                hasConcreteEvidence))
        {
            WouldDemoteIfUnprotectedCount++;
        }

        if (InsightDensityDemotionPredicate.ShouldDemote(
                result.InsightDensityScore,
                demotionThreshold: 65,
                isGenericAdvice,
                hasFalsifiabilitySignal,
                hasConcreteEvidence))
        {
            WouldDemoteAt65Count++;
        }
    }

    public InsightDensityEngineDistributionRow ToRow(string engineType)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(engineType);

        if (_scores.Count == 0)
        {
            throw new InvalidOperationException("Cannot build a distribution row without scores.");
        }

        List<int> sortedScores = _scores.OrderBy(static score => score).ToList();
        int findingCount = sortedScores.Count;

        return new InsightDensityEngineDistributionRow
        {
            EngineType = engineType,
            FindingCount = findingCount,
            MinScore = sortedScores[0],
            MedianScore = ComputeMedian(sortedScores),
            MaxScore = sortedScores[findingCount - 1],
            GenericAdviceCount = GenericAdviceCount,
            NoConcreteEvidenceCount = NoConcreteEvidenceCount,
            NoArchitectureAnchorCount = NoArchitectureAnchorCount,
            DuplicationCount = DuplicationCount,
            WouldDemoteIfUnprotectedCount = WouldDemoteIfUnprotectedCount,
            WouldDemoteAt65Count = WouldDemoteAt65Count,
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
