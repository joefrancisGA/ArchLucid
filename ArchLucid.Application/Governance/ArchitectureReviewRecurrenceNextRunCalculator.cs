using ArchLucid.Decisioning.Advisory.Scheduling;

namespace ArchLucid.Application.Governance;

/// <inheritdoc cref="IArchitectureReviewRecurrenceNextRunCalculator" />
public sealed class ArchitectureReviewRecurrenceNextRunCalculator(IScanScheduleCalculator scheduleCalculator)
    : IArchitectureReviewRecurrenceNextRunCalculator
{
    private readonly IScanScheduleCalculator _scheduleCalculator =
        scheduleCalculator ?? throw new ArgumentNullException(nameof(scheduleCalculator));

    /// <inheritdoc />
    public bool IsSupportedCronExpression(string cronExpression) =>
        _scheduleCalculator.IsSupportedCronExpression(cronExpression);

    /// <inheritdoc />
    public DateTime? ComputeNextRunUtc(string cronExpression, DateTime fromUtc) =>
        _scheduleCalculator.ComputeNextRunUtc(cronExpression, fromUtc);

    /// <inheritdoc />
    public IReadOnlyList<DateTime> ComputeNextRunsUtc(string cronExpression, DateTime fromUtc, int count) =>
        _scheduleCalculator.ComputeNextRunsUtc(cronExpression, fromUtc, count);
}
