namespace ArchLucid.Core.Tenancy;

/// <summary>Workspace row projection for <c>dbo.TenantWorkspaces</c> list APIs.</summary>
public sealed class TenantWorkspaceListItem
{
    public Guid WorkspaceId
    {
        get;
        init;
    }

    public Guid TenantId
    {
        get;
        init;
    }

    public string Name
    {
        get;
        init;
    } = string.Empty;

    public Guid DefaultProjectId
    {
        get;
        init;
    }

    public DateTimeOffset CreatedUtc
    {
        get;
        init;
    }
}
