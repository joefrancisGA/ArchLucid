using ArchLucid.Core.Identity;

namespace ArchLucid.Application.Identity.SignInRouting;

public static class AuthSignInRoutingCustomerMessageBuilder
{
    public const string SsoRequiredMessage =
        "This email domain uses your organization's identity provider. Continue sign-in through your organization's SSO portal.";

    public static AuthSignInRoutingEvaluation Allow(
        string? safeReturnPath,
        AuthSignInRoutingBypassKind bypassKind = AuthSignInRoutingBypassKind.None) =>
        new()
        {
            Decision = AuthSignInRoutingDecision.AllowEmailCode,
            SafeReturnPath = safeReturnPath,
            BypassKind = bypassKind
        };

    public static AuthSignInRoutingEvaluation RequireEnterpriseSso(string? safeReturnPath) =>
        new()
        {
            Decision = AuthSignInRoutingDecision.RequireEnterpriseSso,
            CustomerMessage = SsoRequiredMessage,
            SafeReturnPath = safeReturnPath
        };
}
