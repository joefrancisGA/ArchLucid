namespace ArchLucid.Application.CustomerSuccess;

/// <summary>Plain-language pilot funnel labels for admin tenant-health table (TB-228).</summary>
public static class AdminPilotFunnelStageDeriver
{
    public static string Derive(int totalRuns, int committedRuns, int comparisonEventsLast30Days)
    {
        if (totalRuns == 0)
            return "Not started";

        if (committedRuns == 0)
            return "In progress";

        if (comparisonEventsLast30Days > 0)
            return "Habit forming";

        return "Committed";
    }
}
