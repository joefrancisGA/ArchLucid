using Cronos;

namespace ArchLucid.Decisioning.Advisory.Scheduling;
///     UTC schedule interpreter for advisory scans and architecture review recurrence.
/// </summary>
/// <remarks>
///     Named aliases (<c>@hourly</c>, <c>@daily</c>, <c>@weekly</c>) advance from the reference instant.
///     Standard five-field cron expressions use Cronos calendar semantics in UTC.
///     Unknown or invalid expressions return <see langword="null" /> — never a silent fallback.
/// </remarks>
public sealed class SimpleScanScheduleCalculator : IScanScheduleCalculator
{
    /// <inheritdoc />
    public bool IsSupportedCronExpression(string cronExpression)
    {
        if (string.IsNullOrWhiteSpace(cronExpression))
        {
            return false;
        }

        string cron = cronExpression.Trim();

        if (IsIntervalAlias(cron))
        {
            return true;
        }

        return TryParseCronExpression(cron, out _);
    }

    /// <inheritdoc />
    public DateTime? ComputeNextRunUtc(string cronExpression, DateTime fromUtc)
    {
        if (string.IsNullOrWhiteSpace(cronExpression))
        {
            return null;
        }

        string cron = cronExpression.Trim();

        if (IsIntervalAlias(cron))
        {
            return cron switch
            {
                "@hourly" => fromUtc.AddHours(1),
                "@daily" => fromUtc.AddDays(1),
                "@weekly" => fromUtc.AddDays(7),
                _ => null,
            };
        }

        if (!TryParseCronExpression(cron, out CronExpression? expression) || expression is null)
        {
            return null;
        }

        return expression.GetNextOccurrence(fromUtc, TimeZoneInfo.Utc, inclusive: false);
    }

    /// <inheritdoc />
    public IReadOnlyList<DateTime> ComputeNextRunsUtc(string cronExpression, DateTime fromUtc, int count) =>
        ScanScheduleNextRuns.Compute(this, cronExpression, fromUtc, count);

    private static bool IsIntervalAlias(string cron) =>
        cron is "@hourly" or "@daily" or "@weekly";

    private static bool TryParseCronExpression(string cron, out CronExpression? expression)
    {
        expression = null;

        try
        {
            expression = CronExpression.Parse(cron, CronFormat.Standard);

            return true;
        }
        catch (CronFormatException)
        {
            return false;
        }
    }
}
