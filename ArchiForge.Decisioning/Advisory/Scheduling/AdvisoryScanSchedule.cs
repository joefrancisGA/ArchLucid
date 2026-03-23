namespace ArchiForge.Decisioning.Advisory.Scheduling;

public class AdvisoryScanSchedule
{
    public Guid ScheduleId { get; set; } = Guid.NewGuid();

    public Guid TenantId
    {
        get; set;
    }
    public Guid WorkspaceId
    {
        get; set;
    }
    public Guid ProjectId
    {
        get; set;
    }

    /// <summary>Authority store <c>Runs.ProjectId</c> slug (e.g. <c>default</c>), not the scope GUID.</summary>
    public string RunProjectSlug { get; set; } = "default";

    public string Name { get; set; } = "Daily Advisory Scan";
    public string CronExpression { get; set; } = "0 7 * * *";
    public bool IsEnabled { get; set; } = true;

    public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;
    public DateTime? LastRunUtc
    {
        get; set;
    }
    public DateTime? NextRunUtc
    {
        get; set;
    }
}
