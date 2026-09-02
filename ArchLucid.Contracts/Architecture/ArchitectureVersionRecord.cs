namespace ArchLucid.Contracts.Architecture;

/// <summary>
///     Immutable content-addressed revision of an architecture identity (structured brief + request body).
///     Reviews pin <see cref="ArchitectureVersionId" /> so incremental re-review can prove which revision was evaluated.
/// </summary>
public sealed class ArchitectureVersionRecord
{
    public Guid ArchitectureVersionId
    {
        get;
        set;
    }

    public Guid ArchitectureId
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

    public Guid ScopeProjectId
    {
        get;
        set;
    }

    /// <summary>Monotonic per <see cref="ArchitectureId" /> (1-based).</summary>
    public int VersionNumber
    {
        get;
        set;
    }

    /// <summary>SHA-256 over admitted architecture artifact (κ when present; else intake request).</summary>
    public byte[] ContentHashSha256
    {
        get;
        set;
    } = [];

    /// <summary>SHA-256 over canonical intake <c>ArchitectureRequest</c> JSON (provenance only).</summary>
    public byte[] IntakeRequestHashSha256
    {
        get;
        set;
    } = [];

    public string? SourceRequestId
    {
        get;
        set;
    }

    public DateTime CreatedUtc
    {
        get;
        set;
    }
}
