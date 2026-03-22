namespace ArchiForge.Decisioning.Advisory.Scheduling;

public sealed class SimpleScanScheduleCalculator : IScanScheduleCalculator
{
    public DateTime? ComputeNextRunUtc(string cronExpression, DateTime fromUtc)
    {
        var cron = cronExpression.Trim();
        return cron switch
        {
            "@hourly" => fromUtc.AddHours(1),
            "@daily" => fromUtc.AddDays(1),
            "@weekly" => fromUtc.AddDays(7),
            "0 7 * * *" => NextDailyAtSevenAmUtc(fromUtc),
            _ => fromUtc.AddDays(1)
        };
    }

    private static DateTime NextDailyAtSevenAmUtc(DateTime fromUtc)
    {
        var todaySeven = fromUtc.Date.AddHours(7);
        if (fromUtc < todaySeven)
            return todaySeven;
        return fromUtc.Date.AddDays(1).AddHours(7);
    }
}
