namespace ArchLucid.Contracts.Advisory.Scheduling;

/// <summary>One attempt of an advisory scan for a schedule, including lifecycle status and a JSON summary payload.</summary>
public class AdvisoryScanExecution
{
    public Guid ExecutionId
    {
        get;
        set;
    } = Guid.NewGuid();

    public Guid ScheduleId
    {
        get;
        set;
    }

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

    public DateTime StartedUtc
    {
        get;
        set;
    } = TimeProvider.System.GetUtcNow().UtcDateTime;

    public DateTime? CompletedUtc
    {
        get;
        set;
    }

    public string Status
    {
        get;
        set;
    } = "Started";

    public string ResultJson
    {
        get;
        set;
    } = "{}";

    public string? ErrorMessage
    {
        get;
        set;
    }
}
