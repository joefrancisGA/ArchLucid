namespace ArchLucid.Core.Tenancy;

/// <summary>Row from <c>dbo.Projects</c> for non-deleted architecture projects (API scope metadata).</summary>
public sealed class ArchitectureProjectRecord
{
    public Guid Id
    {
        get;
        init;
    }

    public Guid TenantId
    {
        get;
        init;
    }

    public Guid WorkspaceId
    {
        get;
        init;
    }

    public string Name
    {
        get;
        init;
    } = string.Empty;

    public DateTimeOffset CreatedUtc
    {
        get;
        init;
    }
}
