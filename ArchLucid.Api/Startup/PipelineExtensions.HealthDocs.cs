using ArchLucid.Api.Diagnostics;
using ArchLucid.Core.Authorization;
using ArchLucid.Host.Core.Health;

using Microsoft.AspNetCore.Diagnostics.HealthChecks;

namespace ArchLucid.Api.Startup;

internal static partial class PipelineExtensions
{
    private static WebApplication MapArchLucidHealthAndDocEndpoints(this WebApplication app)
    {
        app.MapHealthChecks("/health/live",
                new HealthCheckOptions { Predicate = static check => check.Tags.Contains(ReadinessTags.Live) })
            .AllowAnonymous();
        app.MapGet(
                "/health/version",
                (IHostEnvironment environment, IConfiguration configuration, TimeProvider timeProvider) =>
                    Results.Ok(ApiBuildInfoFactory.Create(environment, configuration, timeProvider)))
            .AllowAnonymous()
            .CacheOutput("ImmutableShort");
        app.MapHealthChecks("/health/ready", new HealthCheckOptions
            {
                Predicate = static check => check.Tags.Contains(ReadinessTags.Ready),
                ResultStatusCodes = ArchLucidReadinessHealthCheckOptions.ReadyEndpointResultStatusCodes,
                ResponseWriter = static (ctx, r) =>
                    DetailedHealthCheckResponseWriter.WriteAsync(ctx, r, HealthCheckResponseDetailLevel.Summary)
            })
            .AllowAnonymous();
        // Anonymous deep probe: SQL reachability (registration name "database") plus optional Redis when configured (name "redis"). Summary JSON omits exception text and data.
        app.MapHealthChecks("/health", new HealthCheckOptions
            {
                Predicate = static registration =>
                    string.Equals(registration.Name, "database", StringComparison.Ordinal) ||
                    string.Equals(registration.Name, "redis", StringComparison.Ordinal),
                ResponseWriter = static (ctx, r) =>
                    DetailedHealthCheckResponseWriter.WriteAsync(ctx, r, HealthCheckResponseDetailLevel.Summary)
            })
            .AllowAnonymous();
        app.MapHealthChecks("/health/diagnostics", new HealthCheckOptions
            {
                ResponseWriter = static (ctx, r) =>
                    DetailedHealthCheckResponseWriter.WriteAsync(ctx, r, HealthCheckResponseDetailLevel.Detailed)
            })
            .RequireAuthorization(ArchLucidPolicies.ReadAuthority);
        app.MapHealthChecks("/health/detailed", new HealthCheckOptions
            {
                Predicate = static registration =>
                    OperationalDetailedHealthChecks.IsIncluded(registration.Name),
                ResponseWriter = static (ctx, r) =>
                    DetailedHealthCheckResponseWriter.WriteAsync(ctx, r, HealthCheckResponseDetailLevel.Detailed)
            })
            .RequireAuthorization(ArchLucidPolicies.AdminAuthority);

        // OWASP ZAP baseline (and similar spiders) expect 200 on the scan root, /robots.txt, and /sitemap.xml.
        // Without these, the automation plan fails on 404s; SecurityHeadersMiddleware uses short public caching on these paths to satisfy passive 10049-1.
        app.MapGet(
                "/",
                static () => Results.Text("ArchLucid API", "text/plain", statusCode: StatusCodes.Status200OK))
            .AllowAnonymous();
        app.MapGet(
                "/robots.txt",
                static () => Results.Text(
                    "User-agent: *\nAllow: /\n",
                    "text/plain",
                    statusCode: StatusCodes.Status200OK))
            .AllowAnonymous();
        app.MapGet(
                "/sitemap.xml",
                static () => Results.Content(
                    "<?xml version=\"1.0\" encoding=\"UTF-8\"?><urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\"/>",
                    "application/xml",
                    statusCode: StatusCodes.Status200OK))
            .AllowAnonymous();

        return app;
    }
}
