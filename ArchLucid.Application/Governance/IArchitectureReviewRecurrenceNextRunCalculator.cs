namespace ArchLucid.Application.Governance;

/// <summary>
///     Computes the next UTC run instant for architecture review recurrence schedules without pulling
///     <c>ArchLucid.Decisioning</c> types into the API layer.
/// </summary>
public interface IArchitectureReviewRecurrenceNextRunCalculator
{
    bool IsSupportedCronExpression(string cronExpression);

    DateTime? ComputeNextRunUtc(string cronExpression, DateTime fromUtc, bool isScheduleEnabled = true);

    IReadOnlyList<DateTime> ComputeNextRunsUtc(string cronExpression, DateTime fromUtc, int count);
}
