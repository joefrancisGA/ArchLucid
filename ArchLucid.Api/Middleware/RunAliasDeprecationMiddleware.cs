using ArchLucid.Api.Routing;

using Microsoft.AspNetCore.Routing;
using Microsoft.AspNetCore.Routing.Patterns;

namespace ArchLucid.Api.Middleware;

/// <summary>
///     Adds RFC 8594 <c>Deprecation</c> + RFC 8288 <c>Link</c> headers when a request matched a deprecated run-lifecycle
///     alias route (TB-305 / ADR 0042). The alias stays fully functional — only advisory headers are added so integrators
///     migrate to the canonical <c>v1/architecture/*</c> surface. Must run after <c>UseRouting</c> so the matched endpoint
///     (and its route template) is resolved.
/// </summary>
internal sealed class RunAliasDeprecationMiddleware(RequestDelegate next)
{
    public Task InvokeAsync(HttpContext context)
    {
        ArgumentNullException.ThrowIfNull(context);

        RoutePattern? routePattern = (context.GetEndpoint() as RouteEndpoint)?.RoutePattern;
        string? rawTemplate = routePattern?.RawText;

        if (!RunWriteLifecycleRoutes.IsDeprecatedAlias(rawTemplate))
            return next(context);

        string? canonicalTemplate = RunWriteLifecycleRoutes.CanonicalFor(rawTemplate);

        // Headers are deferred to OnStarting so they survive regardless of how the action writes the response body.
        context.Response.OnStarting(() =>
        {
            context.Response.Headers.Append("Deprecation", "true");

            if (canonicalTemplate is not null)
                context.Response.Headers.Append(
                    "Link",
                    $"</{canonicalTemplate}>; rel=\"successor-version\"; title=\"{RunWriteLifecycleRoutes.DeprecationAdr}\"");

            return Task.CompletedTask;
        });

        return next(context);
    }
}
