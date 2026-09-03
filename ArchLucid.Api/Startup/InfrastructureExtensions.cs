using System.IO.Compression;

using ArchLucid.Api.Filters;
using ArchLucid.Api.Middleware;
using ArchLucid.Host.Core.Authorization;
using ArchLucid.Host.Core.Startup;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.ResponseCompression;

namespace ArchLucid.Api.Startup;

internal static partial class InfrastructureExtensions
{
    /// <summary>
    ///     Registers ArchLucid authorization policies (see
    ///     <see cref="ArchLucidAuthorizationPoliciesExtensions.AddArchLucidAuthorizationPolicies" />).
    /// </summary>
    /// <remarks>
    ///     Fallback policy requires an authenticated principal; use <c>[AllowAnonymous]</c> only for intentional public
    ///     surface
    ///     (e.g. <c>/version</c>, <c>/health/live</c>, <c>/health/ready</c>).
    /// </remarks>
    public static IServiceCollection AddArchLucidAuthorization(this IServiceCollection services)
    {
        services.AddArchLucidAuthorizationPolicies();
        services.AddScoped<IAuthorizationHandler, TenantOrProjectCapabilityAuthorizationHandler>();
        services.AddScoped<IAuthorizationHandler, TrialLimitAuthorizationHandler>();
        services.AddSingleton<IAuthorizationMiddlewareResultHandler, TrialLimitAuthorizationResultHandler>();

        return services;
    }

    /// <summary>
    ///     Registers CORS policy <c>ArchLucid</c>. When <c>Cors:AllowedOrigins</c> is empty, no browser origin is allowed.
    ///     Methods and headers are explicit by default; override via <c>Cors:AllowedMethods</c> and <c>Cors:AllowedHeaders</c>
    ///     .
    /// </summary>
    public static IServiceCollection AddArchLucidCors(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        string[] defaultMethods = ["GET", "POST", "PUT", "DELETE", "OPTIONS"];
        string[] defaultHeaders =
        [
            "Content-Type",
            "Authorization",
            "X-Api-Key",
            "X-Correlation-ID",
            "Idempotency-Key",
            "Accept"
        ];

        services.AddCors(options =>
        {
            options.AddPolicy("ArchLucid", policy =>
            {
                string[] origins = configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];

                if (origins.Length == 0)
                {
                    policy.SetIsOriginAllowed(_ => false);
                    return;
                }

                string[]? configuredMethods = configuration.GetSection("Cors:AllowedMethods").Get<string[]>();
                string[] methods = configuredMethods is { Length: > 0 }
                    ? configuredMethods
                    : defaultMethods;

                string[]? configuredHeaders = configuration.GetSection("Cors:AllowedHeaders").Get<string[]>();
                string[] headers = configuredHeaders is { Length: > 0 }
                    ? configuredHeaders
                    : defaultHeaders;

                _ = policy.WithOrigins(origins)
                    .WithMethods(methods)
                    .WithHeaders(headers)
                    .WithExposedHeaders(
                        "Location",
                        "traceparent",
                        "X-Trace-Id",
                        "X-Correlation-ID",
                        ArchLucidRateLimitResponseHeaders.Remaining,
                        ArchLucidRateLimitResponseHeaders.Reset,
                        ArchLucidRateLimitResponseHeaders.Policy,
                        "Retry-After");
            });
        });

        return services;
    }

    /// <summary>Enables Brotli/Gzip for HTTPS responses (default MIME types include JSON).</summary>
    public static IServiceCollection AddArchLucidResponseCompression(this IServiceCollection services)
    {
        services.Configure<BrotliCompressionProviderOptions>(options =>
        {
            options.Level = CompressionLevel.Fastest;
        });
        services.Configure<GzipCompressionProviderOptions>(options =>
        {
            options.Level = CompressionLevel.Fastest;
        });
        services.AddResponseCompression(options =>
        {
            options.EnableForHttps = true;
            options.Providers.Add<BrotliCompressionProvider>();
            options.Providers.Add<GzipCompressionProvider>();
        });

        return services;
    }

    /// <summary>Server-side output cache for anonymous immutable GETs (version probe, marketing showcase).</summary>
    public static IServiceCollection AddArchLucidOutputCache(this IServiceCollection services)
    {
        services.AddOutputCache(options =>
        {
            options.AddPolicy(
                "ImmutableShort",
                builder => builder
                    .Expire(TimeSpan.FromSeconds(30))
                    .SetVaryByHeader("Accept"));

            options.AddPolicy(
                "Showcase",
                builder => builder
                    .Expire(TimeSpan.FromSeconds(300))
                    .SetVaryByRouteValue("runKey")
                    .SetVaryByHeader("Accept"));

            options.AddPolicy(
                "MarketingArtifact",
                builder => builder
                    .Expire(TimeSpan.FromSeconds(300))
                    .SetVaryByHeader("Accept"));
        });

        return services;
    }
}
