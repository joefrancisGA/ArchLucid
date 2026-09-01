namespace ArchLucid.Core.Configuration.Summary;

public sealed class TenantWorkOwnershipDeletePolicyResponse
{
    public bool AllowCreatorDeleteOwnedWork
    {
        get;
        set;
    }
}

public sealed class TenantWorkOwnershipDeletePolicyUpdateRequest
{
    public bool AllowCreatorDeleteOwnedWork
    {
        get;
        set;
    }
}
