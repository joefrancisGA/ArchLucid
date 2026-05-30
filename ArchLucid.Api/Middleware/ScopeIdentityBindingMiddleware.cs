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
            ScopeIdentityBindingValidator.ScopeIdentityBindingResult result =
                ScopeIdentityBindingValidator.Validate(context.User, context.Request.Headers);

            if (!result.IsValid)
            {
                context.Response.StatusCode = StatusCodes.Status403Forbidden;
                await context.Response.WriteAsync(result.FailureMessage ?? "Scope binding rejected.");
                return;
            }
        }

        await next(context);
    }
}
