namespace ArchLucid.Api.Middleware;

using System.Security.Claims;

using ArchLucid.Api.Auth.Services;
using ArchLucid.Host.Core.Auth.Services;

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
    ///     ApiKey principals without <c>tenant_id</c> claims must not steer tenant scope via headers alone (TB-072).
    /// </summary>
    private static ScopeIdentityBindingValidator.ScopeIdentityBindingResult ValidateHeaderOnlyScopeEscalation(
        ClaimsPrincipal user,
        IHeaderDictionary headers)
    {
        string? authType = user.Identity?.AuthenticationType;

        if (!string.Equals(authType, AuthServiceCollectionExtensions.ApiKeySchemeName, StringComparison.Ordinal))
            return ScopeIdentityBindingValidator.ScopeIdentityBindingResult.Ok();

        if (TryParseClaimGuid(user, "tenant_id", out _))
            return ScopeIdentityBindingValidator.ScopeIdentityBindingResult.Ok();

        if (!headers.TryGetValue("x-tenant-id", out StringValues tenantHeader))
            return ScopeIdentityBindingValidator.ScopeIdentityBindingResult.Ok();

        string tenantText = tenantHeader.ToString();

        if (string.IsNullOrWhiteSpace(tenantText))
            return ScopeIdentityBindingValidator.ScopeIdentityBindingResult.Ok();

        return ScopeIdentityBindingValidator.ScopeIdentityBindingResult.Forbidden(
            "API key authentication requires Authentication:ApiKey:TenantId (tenant_id claim); "
            + "x-tenant-id cannot be used without a bound key scope.");
    }

    private static bool TryParseClaimGuid(ClaimsPrincipal user, string claimType, out Guid value)
    {
        value = Guid.Empty;
        string? raw = user.FindFirst(claimType)?.Value;

        return !string.IsNullOrWhiteSpace(raw) && Guid.TryParse(raw, out value);
    }
}
