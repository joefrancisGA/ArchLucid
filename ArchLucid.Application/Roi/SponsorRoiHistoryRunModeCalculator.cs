using ArchLucid.Contracts.Common;

namespace ArchLucid.Application.Roi;

/// <summary>Run-mode breakdown helpers for sponsor ROI history points (TB-239).</summary>
public static class SponsorRoiHistoryRunModeCalculator
{
    public static bool IsRealMode(StructuralExecutionMode mode)
    {
        return mode == StructuralExecutionMode.Real;
    }

    public static bool IsMixedMode(int realRunCount, int simulatorRunCount)
    {
        return realRunCount > 0 && simulatorRunCount > 0;
    }

    public static decimal ComputeRealModeSavingsUsd(decimal totalSavings, int realRunCount, int simulatorRunCount)
    {
        if (realRunCount < 0 || simulatorRunCount < 0)
            return 0m;

        long totalRuns = (long)realRunCount + simulatorRunCount;

        if (totalRuns <= 0 || realRunCount <= 0)
        {
            return 0m;
        }

        // Form the bounded proportion first: dividing savings by a very large run count
        // can round away precision before the real-run share is restored.
        // Multiplication remains within decimal range because 0 <= share <= 1.
        decimal realRunShare = realRunCount / (decimal)totalRuns;
        return totalSavings * realRunShare;
    }
}
