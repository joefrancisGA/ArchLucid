namespace ArchLucid.Api.Middleware;

using ArchLucid.Core.Authorization;
using ArchLucid.Host.Core.Auth.Services;

using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.DependencyInjection;

/// <summary>
///     Rejects authenticated requests where <c>x-*-id</c> headers disagree with scope claims (TB-072).
/// </summary>
internal sealed class ScopeIdentityBindingMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context)
    {
        ArgumentNullException.ThrowIfNull(context);

        // UseAuthentication only runs the default scheme (JwtBearer / ApiKey / DevBypass).
        // SCIM endpoints authenticate ScimBearer at UseAuthorization, which is later in the
        // pipeline — without this, a forged x-tenant-id on /scim/v2 returns 200.

        if (context.User.Identity?.IsAuthenticated != true)
        {
            await TryAuthenticateScimBearerForScopeBindingAsync(context);
        }

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
                ScopeIdentityBindingValidator.ValidateHeaderOnlyScopeEscalation(
                    context.User,
                    context.Request.Headers,
                    context.User.Identity?.AuthenticationType);

            if (!headerOnlyResult.IsValid)
            {
                context.Response.StatusCode = StatusCodes.Status403Forbidden;
                await context.Response.WriteAsync(headerOnlyResult.FailureMessage ?? "Scope binding rejected.");
                return;
            }
        }

        await next(context);
    }

    private static async Task TryAuthenticateScimBearerForScopeBindingAsync(HttpContext context)
    {
        if (!context.Request.Path.StartsWithSegments("/scim", StringComparison.OrdinalIgnoreCase))
            return;

        IServiceProvider? services = context.RequestServices;

        if (services is null)
            return;

        IAuthenticationService? authentication = services.GetService<IAuthenticationService>();

        if (authentication is null)
            return;

        AuthenticateResult scim = await authentication.AuthenticateAsync(
            context,
            ScimBearerDefaults.AuthenticationScheme);

        if (scim.Succeeded && scim.Principal?.Identity?.IsAuthenticated == true)
        {
            context.User = scim.Principal;
        }
    }
}
