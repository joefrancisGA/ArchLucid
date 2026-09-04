namespace ArchLucid.Persistence.Pilots;

public sealed partial class DapperPilotReportCardMetricsReader
{
    private static double? NormalizeAverageSeconds(double? raw)
    {
        if (raw is null)
            return null;

        double v = raw.Value;

        return double.IsNaN(v) || double.IsInfinity(v) ? null : v;
    }

    private static int SafeToInt(object? value)
    {
        switch (value)
        {
            case null:

                return 0;
            case int i:

                return i;
            case long l:

                return l > int.MaxValue ? int.MaxValue : (int)l;
            default:

                return Convert.ToInt32(value, System.Globalization.CultureInfo.InvariantCulture);
        }
    }

    private sealed class SummaryRow
    {
        public object? TotalRuns
        {
            get;
            init;
        }

        public DateTime? PeriodStartUtc
        {
            get;
            init;
        }

        public DateTime? PeriodEndUtc
        {
            get;
            init;
        }

        public double? AverageRequestToCommitSeconds
        {
            get;
            init;
        }

        public object? TotalFindingRowsSnapshot
        {
            get;
            init;
        }
    }
}
