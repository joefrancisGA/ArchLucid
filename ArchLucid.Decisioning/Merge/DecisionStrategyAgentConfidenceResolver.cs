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
        return ResolveAcceptPriorWithSource(result).Prior;
    }

    /// <summary>Resolves accept prior and labels whether calibration or raw self-report was used.</summary>
    public static (double Prior, string Source) ResolveAcceptPriorWithSource(AgentResult result)
    {
        ArgumentNullException.ThrowIfNull(result);

        if (result.CalibratedConfidence is { } calibrated && calibrated >= 0d && calibrated <= 1d)
            return (calibrated, MergeAcceptPriorConfidenceSources.Calibrated);

        return (result.Confidence, MergeAcceptPriorConfidenceSources.Raw);
    }

    /// <summary>Human-readable label for operator explainability when a strategy prior is used.</summary>
    public static string DescribeStrategyPrior(double priorValue)
    {
        return $"strategy prior {priorValue:0.##}";
    }
}
