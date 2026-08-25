namespace ArchLucid.Contracts.Architecture;

/// <summary>
///     Tenant-scoped stable identity for a created architecture across review runs.
///     Points at the current unsealed knowledge model and optional latest sealed manifest.
/// </summary>
public sealed class ArchitectureIdentityRecord
{
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

    public string? CurrentModelId
    {
        get;
        set;
    }

    public Guid? LatestSealedManifestId
    {
        get;
        set;
    }

    public DateTime CreatedUtc
    {
        get;
        set;
    }

    public DateTime UpdatedUtc
    {
        get;
        set;
    }
}
