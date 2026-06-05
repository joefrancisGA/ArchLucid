using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace ArchLucid.Api.Security;

/// <summary>
///     Central guard for routes that bind <c>{tenantId}</c>: forbids when the path tenant differs from ambient scope
///     (TB-276 / BE-014–016).
/// </summary>
public sealed class RouteTenantScopeBindingFilter(IScopeContextProvider scopeContextProvider) : IAsyncActionFilter
{
    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        if (ShouldSkip(context))
        {
            await next();

            return;
        }

        if (context.RouteData.Values.TryGetValue("tenantId", out object? raw) &&
            raw is not null &&
            Guid.TryParse(raw.ToString(), out Guid routeTenantId))
        {
            ScopeContext scope = _scopeContextProvider.GetCurrentScope();
            IActionResult? forbid =
                RouteTenantScopeAuthorization.ForbidWhenRouteTenantDiffersFromScope(routeTenantId, scope);

            if (forbid is not null)
            {
                context.Result = forbid;

                return;
            }
        }

        await next();
    }

    private static bool ShouldSkip(ActionExecutingContext context)
    {
        if (context.ActionDescriptor.EndpointMetadata.Any(static m => m is AllowCrossTenantRouteAttribute))
            return true;

        if (HasPolicy(context, ArchLucidPolicies.PlatformTenantDeletionAuthority))
            return true;

        string path = context.HttpContext.Request.Path.Value ?? string.Empty;

        if (path.Contains("/internal/", StringComparison.OrdinalIgnoreCase))
            return true;

        return false;
    }

    private static bool HasPolicy(ActionExecutingContext context, string policyName)
    {
        foreach (object metadata in context.ActionDescriptor.EndpointMetadata)
        {
            if (metadata is not AuthorizeAttribute authorize)
                continue;

            if (string.Equals(authorize.Policy, policyName, StringComparison.Ordinal))
                return true;
        }

        return false;
    }
}
