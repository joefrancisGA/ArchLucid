namespace ArchiForge.Core.Scoping;

public sealed class ScopeContext
{
    public Guid TenantId
    {
        get; set;
    }
    public Guid WorkspaceId
    {
        get; set;
    }
    public Guid ProjectId
    {
        get; set;
    }
}
