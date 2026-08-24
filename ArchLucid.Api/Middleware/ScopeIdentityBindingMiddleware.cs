namespace ArchLucid.Api.Middleware;

using System.Security.Claims;

using ArchLucid.Api.Auth.Services;
using ArchLucid.Host.Core.Auth.Services;

using ITfoxtec.Identity.Saml2.Schemas;

using Microsoft.Extensions.Primitives;

/// <summary>
///     Rejects authenticated requests where <c>x-*-id</c> headers disagree with scope claims (TB-072).
/// </summary>
internal sealed class ScopeIdentityBindingMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context)
    {
        if (context.User.Identity?.IsAuthenticated == true)
        {
            ScopeIdentityBindingValidator.ScopeIdentityBindingResult claimHeaderResult =
                ScopeIdentityBindingValidator.Validate(context.User, context.Request.Headers);

            if (!claimHeaderResult.IsValid)
            {
                context.Response.StatusCode = StatusCodes.Status403Forbidden;
                await context.Response.WriteAsync(claimHeaderResult.FailureMessage ?? "Scope binding rejected.");
                return;
            }

            ScopeIdentityBindingValidator.ScopeIdentityBindingResult headerOnlyResult =
                ValidateHeaderOnlyScopeEscalation(context.User, context.Request.Headers);

            if (!headerOnlyResult.IsValid)
            {
                context.Response.StatusCode = StatusCodes.Status403Forbidden;
                await context.Response.WriteAsync(headerOnlyResult.FailureMessage ?? "Scope binding rejected.");
                return;
            }
        }

        await next(context);
    }

    /// <summary>
    ///     Principals without a bound <c>tenant_id</c> claim must not steer tenant scope via headers alone (TB-072).
    /// </summary>
    private static ScopeIdentityBindingValidator.ScopeIdentityBindingResult ValidateHeaderOnlyScopeEscalation(
        ClaimsPrincipal user,
        IHeaderDictionary headers)
    {
        string? authType = user.Identity?.AuthenticationType;

        if (!RequiresBoundTenantClaimForHeaders(authType))
            return ScopeIdentityBindingValidator.ScopeIdentityBindingResult.Ok();

        if (TryParseClaimGuid(user, "tenant_id", out _))
            return ScopeIdentityBindingValidator.ScopeIdentityBindingResult.Ok();

        if (!headers.TryGetValue("x-tenant-id", out StringValues tenantHeader))
            return ScopeIdentityBindingValidator.ScopeIdentityBindingResult.Ok();

        string tenantText = tenantHeader.ToString();

        if (string.IsNullOrWhiteSpace(tenantText))
            return ScopeIdentityBindingValidator.ScopeIdentityBindingResult.Ok();

        if (string.Equals(authType, AuthServiceCollectionExtensions.ApiKeySchemeName, StringComparison.Ordinal))
        {
            return ScopeIdentityBindingValidator.ScopeIdentityBindingResult.Forbidden(
                "API key authentication requires Authentication:ApiKey:TenantId (tenant_id claim); "
                + "x-tenant-id cannot be used without a bound key scope.");
        }

        return ScopeIdentityBindingValidator.ScopeIdentityBindingResult.Forbidden(
            "Authenticated scope is not bound to a tenant_id claim; "
            + "x-tenant-id cannot be used to steer tenant scope.");
    }

    private static bool RequiresBoundTenantClaimForHeaders(string? authType)
    {
        if (string.Equals(authType, AuthServiceCollectionExtensions.ApiKeySchemeName, StringComparison.Ordinal))
            return true;

        if (string.Equals(authType, "Bearer", StringComparison.Ordinal))
            return true;

        if (string.Equals(authType, Saml2Constants.AuthenticationScheme, StringComparison.Ordinal)
            || string.Equals(authType, Saml2Constants.AuthenticationScheme, StringComparison.OrdinalIgnoreCase))
            return true;

        return false;
    }

    private static bool TryParseClaimGuid(ClaimsPrincipal user, string claimType, out Guid value)
    {
        value = Guid.Empty;
        string? raw = user.FindFirst(claimType)?.Value;

        return !string.IsNullOrWhiteSpace(raw) && Guid.TryParse(raw, out value);
    }
}
