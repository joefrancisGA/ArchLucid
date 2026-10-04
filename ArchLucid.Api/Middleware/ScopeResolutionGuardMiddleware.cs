using ArchLucid.Api.Security;
using ArchLucid.Core.Scoping;
using ArchLucid.Host.Core.Configuration;

using Microsoft.AspNetCore.Authorization;

namespace ArchLucid.Api.Middleware;

/// <summary>
///     Rejects production-like requests whose tenant/workspace/project scope is not bound to identity claims or an explicit
///     ambient job override (TB-304).
/// </summary>
internal sealed class ScopeResolutionGuardMiddleware(
    RequestDelegate next,
    IHostEnvironment hostEnvironment,
    IConfiguration configuration)
{
    public async Task InvokeAsync(HttpContext context, IScopeContextProvider scopeContextProvider)
    {
        ArgumentNullException.ThrowIfNull(context);
        ArgumentNullException.ThrowIfNull(scopeContextProvider);

        if (!HostEnvironmentClassification.IsProductionOrStagingLike(hostEnvironment, configuration))
        {
            await next(context);

            return;
        }

        if (ShouldSkip(context))
        {
            await next(context);

            return;
        }

        ScopeResolution resolution = scopeContextProvider.ResolveCurrentScope();

        if (ScopeResolutionGuard.RequiresTrustedScopeRejection(resolution))
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            await context.Response.WriteAsync(
                "Tenant, workspace, and project scope must be resolved from identity claims or an explicit job override.");

            return;
        }

        await next(context);
    }

    private static bool ShouldSkip(HttpContext context)
    {
        string path = context.Request.Path.Value ?? string.Empty;
        PathString pathString = context.Request.Path;

        if (path.Contains("/internal/", StringComparison.OrdinalIgnoreCase))
            return true;

        if (IsPublicHealthProbePath(pathString))
            return true;

        // Canonical OpenAPI document (MapOpenApi) — contract probes must not require tenant scope.

        if (pathString.StartsWithSegments("/openapi", StringComparison.OrdinalIgnoreCase))
            return true;

        if (path is "/" or "/robots.txt" or "/sitemap.xml")
            return true;

        Endpoint? endpoint = context.GetEndpoint();

        if (endpoint?.Metadata.GetMetadata<AllowUnscopedRouteAttribute>() is not null)
            return true;

        if (endpoint?.Metadata.GetMetadata<IAllowAnonymous>() is not null)
            return true;

        return false;
    }

    private static bool IsPublicHealthProbePath(PathString path) =>
        path.StartsWithSegments("/health/live", StringComparison.OrdinalIgnoreCase)
        || path.StartsWithSegments("/health/ready", StringComparison.OrdinalIgnoreCase)
        || path.StartsWithSegments("/health/version", StringComparison.OrdinalIgnoreCase)
        || IsRootHealthAggregateProbe(path);

    private static bool IsRootHealthAggregateProbe(PathString path)
    {
        string? value = path.Value;

        if (string.IsNullOrEmpty(value))
            return false;

        return string.Equals(value.TrimEnd('/'), "/health", StringComparison.OrdinalIgnoreCase);
    }
}
