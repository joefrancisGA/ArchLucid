namespace ArchLucid.Decisioning.Advisory.Scheduling;

/// <summary>
///     Computes the next UTC run time from a cron string after a reference instant (typically “now” after a scan).
/// </summary>
/// <remarks>
///     Registered scoped in DI. Default implementation: <see cref="SimpleScanScheduleCalculator" />.
///     Used when creating schedules and when <c>AdvisoryScanRunner</c> advances
///     <see cref="AdvisoryScanSchedule.NextRunUtc" />.
/// </remarks>
public interface IScanScheduleCalculator
{
    /// <summary>
    ///     Returns whether <paramref name="cronExpression" /> is a supported alias or valid five-field cron expression.
    /// </summary>
    bool IsSupportedCronExpression(string cronExpression);

    /// <summary>
    ///     Returns the next eligible run instant in UTC after <paramref name="fromUtc" />.
    /// </summary>
    /// <param name="cronExpression">Expression or alias (e.g. <c>@daily</c>, <c>0 7 * * *</c>).</param>
    /// <param name="fromUtc">Reference instant in UTC.</param>
    /// <returns>Next run UTC, or <see langword="null" /> when the expression is invalid or unsupported.</returns>
    DateTime? ComputeNextRunUtc(string cronExpression, DateTime fromUtc);

    /// <summary>
    ///     Returns the next <paramref name="count" /> run instants in UTC, chaining from each computed tick.
    /// </summary>
    IReadOnlyList<DateTime> ComputeNextRunsUtc(string cronExpression, DateTime fromUtc, int count);
}
