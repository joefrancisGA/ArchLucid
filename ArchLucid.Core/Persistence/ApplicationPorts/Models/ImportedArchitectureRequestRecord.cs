namespace ArchLucid.Persistence.Models;

public sealed class ImportedArchitectureRequestRecord
{
    public Guid ImportId
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

    public DateTime CreatedUtc
    {
        get;
        set;
    }

    public string SourceFileName
    {
        get;
        set;
    } = null!;

    /// <summary><c>toml</c> or <c>json</c>.</summary>
    public string Format
    {
        get;
        set;
    } = null!;

    public string Status
    {
        get;
        set;
    } = "Draft";

    public string? RequestJson
    {
        get;
        set;
    }
}
