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
        PathString pathString = NormalizeProbePath(context.Request.Path);
        string path = pathString.Value ?? string.Empty;

        if (path.Contains("/internal/", StringComparison.OrdinalIgnoreCase))
            return true;

        if (IsPublicHealthProbePath(pathString))
            return true;

        // Canonical OpenAPI document (MapOpenApi) — contract probes must not require tenant scope.

        if (pathString.StartsWithSegments("/openapi", StringComparison.OrdinalIgnoreCase))
            return true;

        if (IsRootOrCrawlerHintPath(path))
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

    private static bool IsRootOrCrawlerHintPath(string path)
    {
        if (string.Equals(path, "/", StringComparison.Ordinal))
            return true;

        string trimmed = path.TrimEnd('/');

        return string.Equals(trimmed, "/robots.txt", StringComparison.OrdinalIgnoreCase)
            || string.Equals(trimmed, "/sitemap.xml", StringComparison.OrdinalIgnoreCase);
    }

    /// <summary>
    ///     Drops empty and <c>.</c> segments so probe checks see the same path a client already
    ///     resolved. Parent segments stay, because routing still uses the raw request path and
    ///     <c>/health/live/../v1/runs</c> must not be treated as <c>/v1/runs</c>.
    /// </summary>
    private static PathString NormalizeProbePath(PathString path)
    {
        string? value = path.Value;

        if (string.IsNullOrEmpty(value))
            return path;

        string[] rawSegments = value.Split('/');
        List<string> segments = [];

        foreach (string rawSegment in rawSegments)
        {

            if (rawSegment.Length == 0 || string.Equals(rawSegment, ".", StringComparison.Ordinal))
                continue;

            segments.Add(rawSegment);
        }

        if (segments.Count == 0)
            return new PathString("/");

        return new PathString("/" + string.Join('/', segments));
    }
}
