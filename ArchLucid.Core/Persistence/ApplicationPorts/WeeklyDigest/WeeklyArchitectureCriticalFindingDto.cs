namespace ArchLucid.Persistence.WeeklyDigest;

/// <summary>SQL projection for scaffolding the weekly architecture digest (critical findings only).</summary>
public sealed class WeeklyArchitectureCriticalFindingDto
{
    public required string FindingId
    {
        get;
        init;
    }

    public required string Title
    {
        get;
        init;
    }

    public required string Category
    {
        get;
        init;
    }

    public Guid TenantId
    {
        get;
        init;
    }

    public DateTime SnapshotCreatedUtc
    {
        get;
        init;
    }
}
