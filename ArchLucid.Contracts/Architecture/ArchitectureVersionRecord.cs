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

    /// <summary>SHA-256 over canonical <c>ArchitectureRequest</c> JSON (same algorithm as create-run idempotency).</summary>
    public byte[] ContentHashSha256
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
