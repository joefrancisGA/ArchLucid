namespace ArchLucid.Contracts.Advisory.Scheduling;

/// <summary>Persisted architecture summary for a scope: markdown body, summary, optional run linkage, and metadata JSON.</summary>
public class ArchitectureDigest
{
    public Guid DigestId
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

    public Guid? RunId
    {
        get;
        set;
    }

    public Guid? ComparedToRunId
    {
        get;
        set;
    }

    public DateTime GeneratedUtc
    {
        get;
        set;
    } = TimeProvider.System.GetUtcNow().UtcDateTime;

    public string Title
    {
        get;
        set;
    } = null!;

    public string Summary
    {
        get;
        set;
    } = null!;

    public string ContentMarkdown
    {
        get;
        set;
    } = null!;

    public string MetadataJson
    {
        get;
        set;
    } = "{}";

    public DateTime? ArchivedUtc
    {
        get;
        set;
    }
}
