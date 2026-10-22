using ArchLucid.Contracts.Governance;

namespace ArchLucid.Application.Governance.Stickiness;

/// <summary>Outcome of <see cref="IGovernanceStickinessFacade.UpdateRecurrenceScheduleAsync"/>.</summary>
public enum RecurrenceScheduleUpdateOutcome
{
    Updated,
    NotFound,
    InvalidCron,
}

/// <summary>Result of <see cref="IGovernanceStickinessFacade.UpdateRecurrenceScheduleAsync"/>.</summary>
public sealed record RecurrenceScheduleUpdateResult(
    RecurrenceScheduleUpdateOutcome Outcome,
    ArchitectureReviewRecurrenceSchedule? Schedule);
