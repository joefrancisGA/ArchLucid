using ArchLucid.Decisioning.Advisory.Scheduling;

namespace ArchLucid.Application.Governance;

/// <inheritdoc cref="IArchitectureReviewRecurrenceNextRunCalculator" />
public sealed class ArchitectureReviewRecurrenceNextRunCalculator(IScanScheduleCalculator scheduleCalculator)
    : IArchitectureReviewRecurrenceNextRunCalculator
{
    private readonly IScanScheduleCalculator _scheduleCalculator =
        scheduleCalculator ?? throw new ArgumentNullException(nameof(scheduleCalculator));

    /// <inheritdoc />
    public DateTime? ComputeNextRunUtc(string cronExpression, DateTime fromUtc) =>
        _scheduleCalculator.ComputeNextRunUtc(cronExpression, fromUtc);
}
