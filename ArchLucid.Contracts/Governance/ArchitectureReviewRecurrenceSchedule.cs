namespace ArchLucid.Contracts.Governance;

/// <summary>
///     CRON-style schedule to automatically start a follow-up architecture review from a committed source run (TB-059–063).
/// </summary>
public sealed class ArchitectureReviewRecurrenceSchedule
{
    public Guid ScheduleId
    {
        get;
        set;
    } = Guid.NewGuid();

    public Guid TenantId
    {
        get;
        set;
    }

    public Guid WorkspaceId
    {
        get;
        set;
    }

    public Guid ProjectId
    {
        get;
        set;
    }

    public Guid SourceRunId
    {
        get;
        set;
    }

    public string Name
    {
        get;
        set;
    } = "Recurring architecture review";

    public string CronExpression
    {
        get;
        set;
    } = "0 8 * * 1";

    public bool IsEnabled
    {
        get;
        set;
    } = true;

    public DateTime CreatedUtc
    {
        get;
        set;
    } = TimeProvider.System.GetUtcNow().UtcDateTime;

    public DateTime? LastTriggeredUtc
    {
        get;
        set;
    }

    public Guid? LastTriggeredRunId
    {
        get;
        set;
    }

    public DateTime? NextRunUtc
    {
        get;
        set;
    }

    public string CreatedByUserId
    {
        get;
        set;
    } = string.Empty;
}
