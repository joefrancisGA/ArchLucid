namespace ArchLucid.Contracts.Persistence.Data;

/// <summary>Persisted append-only snapshot of a decision provenance graph (JSON).</summary>
public class DecisionProvenanceSnapshot
{
    public Guid Id
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

    public Guid RunId
    {
        get;
        set;
    }

    public string GraphJson
    {
        get;
        set;
    } = "{}";

    public DateTime CreatedUtc
    {
        get;
        set;
    }

    /// <summary>SHA-256 fingerprint of manifest/findings/graph/trace/bundle ids; used to skip stale snapshot reads.</summary>
    public string? SourceRevisionHash
    {
        get;
        set;
    }
}
