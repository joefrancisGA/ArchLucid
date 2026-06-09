namespace ArchLucid.Api.Tests.Security;

/// <summary>
///     DevBypass host with <c>AllowTestActorHeaders=false</c> so scope claims stay configuration-bound and
///     <c>ScopeIdentityBindingMiddleware</c> can reject hostile <c>x-*-id</c> headers (TB-300).
/// </summary>
internal sealed class ScopeIdentityBindingDevBypassArchLucidApiFactory : ArchLucidApiFactory
{
    protected override void AddCustomSettings(Dictionary<string, string?> settings)
    {
        base.AddCustomSettings(settings);
        settings["ArchLucidAuth:AllowTestActorHeaders"] = "false";
    }
}
