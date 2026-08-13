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
        int totalRuns = realRunCount + simulatorRunCount;

        if (totalRuns <= 0 || realRunCount <= 0)
        {
            return 0m;
        }

        return totalSavings * realRunCount / totalRuns;
    }
}
