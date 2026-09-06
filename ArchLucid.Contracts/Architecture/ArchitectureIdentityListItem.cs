namespace ArchLucid.Contracts.Architecture;

/// <summary>One row in a scoped architecture identity list.</summary>
public sealed class ArchitectureIdentityListItem
{
    public Guid ArchitectureId
    {
        get;
        set;
    }

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

    public DateTime UpdatedUtc
    {
        get;
        set;
    }

    public Guid? LatestSealedManifestId
    {
        get;
        set;
    }

    public ArchitectureIdentityChildPointers ChildPointers
    {
        get;
        set;
    } = new();
}
