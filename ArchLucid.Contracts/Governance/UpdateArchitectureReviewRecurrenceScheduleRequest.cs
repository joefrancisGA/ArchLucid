namespace ArchLucid.Contracts.Governance;

/// <summary>Partial update for <see cref="ArchitectureReviewRecurrenceSchedule"/> (enable/disable toggle).</summary>
public sealed class UpdateArchitectureReviewRecurrenceScheduleRequest
{
    public bool? IsEnabled
    {
        get;
        set;
    }

    public string? Name
    {
        get;
        set;
    }

    public string? CronExpression
    {
        get;
        set;
    }
}
