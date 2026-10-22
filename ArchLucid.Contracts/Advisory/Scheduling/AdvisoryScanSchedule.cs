namespace ArchLucid.Contracts.Advisory.Scheduling;

/// <summary>Tenant-scoped CRON-style definition for recurring advisory scans.</summary>
public class AdvisoryScanSchedule
{
    public const string DefaultProjectSlug = "default";

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

    public string RunProjectSlug
    {
        get;
        set;
    } = DefaultProjectSlug;

    public string Name
    {
        get;
        set;
    } = "Daily Advisory Scan";

    public string CronExpression
    {
        get;
        set;
    } = "0 7 * * *";

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

    public DateTime? LastRunUtc
    {
        get;
        set;
    }

    public DateTime? NextRunUtc
    {
        get;
        set;
    }
}
