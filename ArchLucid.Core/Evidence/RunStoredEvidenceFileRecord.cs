namespace ArchLucid.Core.Evidence;

/// <summary>Persisted metadata for one bulk-uploaded or intake-retained evidence file on a review run.</summary>
public sealed class RunStoredEvidenceFileRecord
{
    public string EvidenceItemId
    {
        get;
        set;
    } = "";

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

    public Guid ScopeProjectId
    {
        get;
        set;
    }

    public Guid RunId
    {
        get;
        set;
    }

    public string OriginalFileName
    {
        get;
        set;
    } = "";

    public string ContentType
    {
        get;
        set;
    } = "";

    public long ByteLength
    {
        get;
        set;
    }

    public string BlobUri
    {
        get;
        set;
    } = "";

    public DateTime CreatedUtc
    {
        get;
        set;
    }

    public string ActorUserId
    {
        get;
        set;
    } = "";
}
