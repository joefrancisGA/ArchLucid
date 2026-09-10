namespace ArchLucid.Core.Findings;

/// <summary>
///     Shared demotion predicate for <see cref="DeterministicInsightDensityGate" /> and distribution telemetry.
/// </summary>
public static class InsightDensityDemotionPredicate
{
    public static bool ShouldDemote(
        int score,
        int demotionThreshold,
        bool isGenericAdvice,
        bool hasFalsifiabilitySignal,
        bool hasConcreteEvidence)
    {
        bool genericWithoutEvidence = isGenericAdvice && !hasConcreteEvidence;
        bool falsifiableWithoutEvidence = hasFalsifiabilitySignal && !hasConcreteEvidence;

        return (score < demotionThreshold || genericWithoutEvidence || falsifiableWithoutEvidence)
            && !hasConcreteEvidence;
    }
}
