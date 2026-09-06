namespace ArchLucid.Contracts.Architecture;

/// <summary>Arguments for creating a tenant-scoped architecture identity row.</summary>
public sealed class ArchitectureIdentityCreateArgs
{
    public string DisplayName
    {
        get;
        set;
    } = string.Empty;

    public string? Description
    {
        get;
        set;
    }

    public string? CurrentModelId
    {
        get;
        set;
    }
}
