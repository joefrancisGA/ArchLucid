namespace ArchLucid.Application.Governance;

/// <summary>
///     Computes the next UTC run instant for architecture review recurrence schedules without pulling
///     <c>ArchLucid.Decisioning</c> types into the API layer.
/// </summary>
public interface IArchitectureReviewRecurrenceNextRunCalculator
{
    DateTime? ComputeNextRunUtc(string cronExpression, DateTime fromUtc);
}
