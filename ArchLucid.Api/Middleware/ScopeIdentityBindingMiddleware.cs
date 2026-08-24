namespace ArchLucid.Api.Middleware;

using ArchLucid.Host.Core.Auth.Services;

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
}
