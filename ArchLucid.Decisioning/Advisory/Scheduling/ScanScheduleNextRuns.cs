namespace ArchLucid.Decisioning.Advisory.Scheduling;

/// <summary>
///     Validates and expands recurrence cron expressions into upcoming UTC run instants.
/// </summary>
public static class ScanScheduleNextRuns
{
    /// <summary>
    ///     Returns up to <paramref name="count" /> next UTC instants after <paramref name="fromUtc" />.
    /// </summary>
    public static IReadOnlyList<DateTime> Compute(
        IScanScheduleCalculator calculator,
        string cronExpression,
        DateTime fromUtc,
        int count)
    {
        ArgumentNullException.ThrowIfNull(calculator);

        if (count <= 0)
        {
            return Array.Empty<DateTime>();
        }

        List<DateTime> results = new(capacity: count);
        DateTime cursor = fromUtc;

        for (int index = 0; index < count; index += 1)
        {
            DateTime? next = calculator.ComputeNextRunUtc(cronExpression, cursor);

            if (next is null)
            {
                break;
            }

            results.Add(next.Value);
            cursor = next.Value;
        }

        return results;
    }
}
