namespace ArchLucid.Contracts.User;

/// <summary>Request body for <c>PUT /v1/user/preferences/cloud-platforms</c>.</summary>
public sealed class SetCloudPlatformScopeRequest
{
    public CloudPlatformScopeDto Scope
    {
        get;
        set;
    } = CloudPlatformScopeValues.Default;
}
