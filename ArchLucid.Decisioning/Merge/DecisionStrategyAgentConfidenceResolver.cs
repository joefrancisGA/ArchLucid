using ArchLucid.Contracts.Agents;

namespace ArchLucid.Decisioning.Merge;

/// <summary>Resolves agent confidence for V2 merge strategies, preferring calibrated values (TB-051).</summary>
public static class DecisionStrategyAgentConfidenceResolver
{
    /// <summary>
    ///     Returns <see cref="AgentResult.CalibratedConfidence" /> when present in [0,1]; otherwise
    ///     <see cref="AgentResult.Confidence" />.
    /// </summary>
    public static double ResolveAcceptPrior(AgentResult result)
    {
        ArgumentNullException.ThrowIfNull(result);

        if (result.CalibratedConfidence is { } calibrated && calibrated >= 0d && calibrated <= 1d)
            return calibrated;

        return result.Confidence;
    }

    /// <summary>Human-readable label for operator explainability when a strategy prior is used.</summary>
    public static string DescribeStrategyPrior(double priorValue)
    {
        return $"strategy prior {priorValue:0.##}";
    }
}
