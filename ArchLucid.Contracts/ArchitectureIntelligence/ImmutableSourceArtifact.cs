namespace ArchLucid.Contracts.ArchitectureIntelligence;

public class ImmutableSourceArtifact
{
    public string ArtifactId
    {
        get;
        set;
    } = null!;

    public string TenantId
    {
        get;
        set;
    } = null!;

    public string ContentSha256
    {
        get;
        set;
    } = null!;

    public string ContentType
    {
        get;
        set;
    } = null!;

    public string? FileName
    {
        get;
        set;
    }

    public ArtifactOwnershipClass OwnershipClass
    {
        get;
        set;
    }

    public DateTime CreatedUtc
    {
        get;
        set;
    }

    public string Version
    {
        get;
        set;
    } = null!;

    public string? BlobUri
    {
        get;
        set;
    }

    public Dictionary<string, string> Metadata
    {
        get;
        set;
    } = new();
}
