namespace ArchLucid.Application.WeeklyArchitectureDigest;

/// <summary>Contract-shaped row for serialized mock digest payloads (no persistence DTOs on the wire).</summary>
public sealed class WeeklyArchitectureDigestCriticalFindingSummaryLine
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
