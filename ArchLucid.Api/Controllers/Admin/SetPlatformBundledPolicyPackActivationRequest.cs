namespace ArchLucid.Api.Controllers.Admin;

/// <summary>Body for <c>PUT /v1/admin/platform-bundled-policy-packs/{bundleContentFile}/activation</c>.</summary>
public sealed class SetPlatformBundledPolicyPackActivationRequest
{
    public bool IsGloballyActive
    {
        get;
        set;
    }
}
