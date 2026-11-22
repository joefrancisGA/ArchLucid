namespace ArchLucid.Core.Findings;

/// <summary>
///     Pre-flight sizing for Premium insight-density judge completions from remaining tenant USD (DX-62).
/// </summary>
public static class InsightDensityJudgeBudgetCap
{
    public static int Resolve(int configuredCap, decimal? remainingUsd, decimal? estimatedCostPerJudgmentUsd)
    {
        if (configuredCap <= 0)
        {
            return 0;
        }

        if (remainingUsd is null || estimatedCostPerJudgmentUsd is null || estimatedCostPerJudgmentUsd <= 0m)
        {
            return configuredCap;
        }

        if (remainingUsd <= 0m)
        {
            return 0;
        }

        try
        {
            decimal affordableJudgments = remainingUsd.Value / estimatedCostPerJudgmentUsd.Value;
            return (int)Math.Min(Math.Floor(affordableJudgments), configuredCap);
        }
        catch (OverflowException)
        {
            // A positive quotient beyond decimal's range also exceeds the configured cap.
            return configuredCap;
        }
    }
}
