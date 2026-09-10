namespace ArchLucid.Core.Persistence.ApplicationPorts.Architecture;

public sealed class ArchitectureShareRecord
{
    public Guid ArchitectureId
    {
        get;
        set;
    }

    public Guid UserId
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

    public string Role
    {
        get;
        set;
    } = ArchitectureShareRoles.View;

    public string GrantedBy
    {
        get;
        set;
    } = string.Empty;

    public DateTime GrantedUtc
    {
        get;
        set;
    }
}
