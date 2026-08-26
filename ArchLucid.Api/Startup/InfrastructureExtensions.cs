using System.Globalization;
using System.IO.Compression;
using System.Security.Claims;
using System.Threading.RateLimiting;

using ArchLucid.Api.Filters;
using ArchLucid.Api.Middleware;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Evidence;
using ArchLucid.Host.Core.Authorization;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.Startup;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.ResponseCompression;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Logging;

namespace ArchLucid.Api.Startup;

internal static class InfrastructureExtensions
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

    public static IServiceCollection AddArchLucidRateLimiting(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.TryAddSingleton(TimeProvider.System);
        services.Configure<EvidenceBulkUploadAnomalyOptions>(
            configuration.GetSection(EvidenceBulkUploadAnomalyOptions.SectionPath));
        services.AddSingleton<IEvidenceBulkUploadAnomalyTracker, EvidenceBulkUploadAnomalyTracker>();

        services.Configure<RateLimitingRoleMultiplierOptions>(
            configuration.GetSection(RateLimitingRoleMultiplierOptions.SectionPath));

        services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

            options.OnRejected = async (context, cancellationToken) =>
            {
                HttpContext httpContext = context.HttpContext;
                httpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;

                EnableRateLimitingAttribute? rateLimitAttribute =
                    httpContext.GetEndpoint()?.Metadata.GetMetadata<EnableRateLimitingAttribute>();
                string policyName = rateLimitAttribute?.PolicyName ?? "unknown";
                string correlationId = httpContext.TraceIdentifier;
                ILogger rateLimitLogger =
                    httpContext.RequestServices.GetRequiredService<ILoggerFactory>()
                        .CreateLogger("ArchLucid.RateLimiting");

                if (rateLimitLogger.IsEnabled(LogLevel.Warning))
                {
                    rateLimitLogger.LogWarning(
                        "Rate limit rejected request. Policy={RateLimitPolicy} CorrelationId={CorrelationId} Path={Path}",
                        policyName,
                        correlationId,
                        httpContext.Request.Path.Value);
                }

                ArchLucidRateLimitResponseHeaders.AttachRejectionHeaders(httpContext.Response, context.Lease);

                if (context.Lease.TryGetMetadata(MetadataName.RetryAfter, out TimeSpan retryAfter))
                {
                    int seconds = Math.Max(1, (int)Math.Ceiling(retryAfter.TotalSeconds));
                    httpContext.Response.Headers.RetryAfter = seconds.ToString(NumberFormatInfo.InvariantInfo);
                }

                Microsoft.AspNetCore.Mvc.ProblemDetails problem = new()
                {
                    Type = "https://archlucid.net/problems/rate-limit-exceeded",
                    Title = "Rate limit exceeded",
                    Status = StatusCodes.Status429TooManyRequests,
                    Detail =
                        "Rate limit exceeded. Honor the Retry-After response header (seconds) before retrying this client identity.",
                    Instance = httpContext.Request.Path
                };

                if (context.Lease.TryGetMetadata(MetadataName.RetryAfter, out TimeSpan retryAfterMeta))
                {
                    int seconds = Math.Max(1, (int)Math.Ceiling(retryAfterMeta.TotalSeconds));
                    problem.Extensions["retryAfterSeconds"] = seconds;
                }

                ProblemCorrelation.Attach(problem, httpContext);
                await httpContext.Response.WriteAsJsonAsync(
                    problem,
                    options: null,
                    contentType: ApplicationProblemMapper.ProblemJsonMediaType,
                    cancellationToken: cancellationToken).ConfigureAwait(false);
            };

            int fixedPermitLimit = configuration.GetValue(
                "RateLimiting:FixedWindow:PermitLimit",
                RateLimitingDefaults.FixedWindowPermitLimit);
            int fixedWindowMinutes = configuration.GetValue("RateLimiting:FixedWindow:WindowMinutes", 1);
            int fixedQueueLimit = configuration.GetValue("RateLimiting:FixedWindow:QueueLimit", 0);

            options.AddPolicy(
                "fixed",
                httpContext => RateLimitingRolePartitionBuilder.CreateFixedWindow(
                    httpContext,
                    fixedPermitLimit,
                    fixedWindowMinutes,
                    fixedQueueLimit,
                    "fixed"));

            int registrationPermitLimit = configuration.GetValue("RateLimiting:Registration:PermitLimit", 5);
            int registrationWindowMinutes = configuration.GetValue("RateLimiting:Registration:WindowMinutes", 60);
            int registrationQueueLimit = configuration.GetValue("RateLimiting:Registration:QueueLimit", 0);

            options.AddPolicy(
                "registration",
                httpContext =>
                {
                    string ip = httpContext.Connection.RemoteIpAddress?.ToString() ?? "anonymous";

                    return RateLimitPartition.GetFixedWindowLimiter(
                        $"registration:{ip}",
                        _ => new FixedWindowRateLimiterOptions
                        {
                            PermitLimit = registrationPermitLimit,
                            Window = TimeSpan.FromMinutes(registrationWindowMinutes),
                            QueueLimit = registrationQueueLimit
                        });
                });

            int emailOtpPermitLimit = configuration.GetValue("RateLimiting:EmailOtp:PermitLimit", 10);
            int emailOtpWindowMinutes = configuration.GetValue("RateLimiting:EmailOtp:WindowMinutes", 15);
            int emailOtpQueueLimit = configuration.GetValue("RateLimiting:EmailOtp:QueueLimit", 0);

            options.AddPolicy(
                "email-otp",
                httpContext =>
                {
                    string ip = httpContext.Connection.RemoteIpAddress?.ToString() ?? "anonymous";

                    return RateLimitPartition.GetFixedWindowLimiter(
                        $"email-otp:{ip}",
                        _ => new FixedWindowRateLimiterOptions
                        {
                            PermitLimit = emailOtpPermitLimit,
                            Window = TimeSpan.FromMinutes(emailOtpWindowMinutes),
                            QueueLimit = emailOtpQueueLimit
                        });
                });

            int authRoutingPermitLimit = configuration.GetValue("RateLimiting:AuthRouting:PermitLimit", 10);
            int authRoutingWindowMinutes = configuration.GetValue("RateLimiting:AuthRouting:WindowMinutes", 15);
            int authRoutingQueueLimit = configuration.GetValue("RateLimiting:AuthRouting:QueueLimit", 0);

            options.AddPolicy(
                "auth-routing",
                httpContext =>
                {
                    string ip = httpContext.Connection.RemoteIpAddress?.ToString() ?? "anonymous";

                    return RateLimitPartition.GetFixedWindowLimiter(
                        $"auth-routing:{ip}",
                        _ => new FixedWindowRateLimiterOptions
                        {
                            PermitLimit = authRoutingPermitLimit,
                            Window = TimeSpan.FromMinutes(authRoutingWindowMinutes),
                            QueueLimit = authRoutingQueueLimit
                        });
                });

            int bootstrapWorkspacePermitLimit = configuration.GetValue("RateLimiting:BootstrapWorkspace:PermitLimit", 5);
            int bootstrapWorkspaceWindowMinutes = configuration.GetValue("RateLimiting:BootstrapWorkspace:WindowMinutes", 60);

            options.AddPolicy(
                "bootstrap-workspace",
                httpContext =>
                {
                    string? sub = httpContext.User.FindFirst("sub")?.Value
                        ?? httpContext.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                    string key = string.IsNullOrWhiteSpace(sub) ? "anonymous" : sub;

                    return RateLimitPartition.GetFixedWindowLimiter(
                        $"bootstrap-workspace:{key}",
                        _ => new FixedWindowRateLimiterOptions
                        {
                            PermitLimit = bootstrapWorkspacePermitLimit,
                            Window = TimeSpan.FromMinutes(bootstrapWorkspaceWindowMinutes),
                            QueueLimit = 0
                        });
                });

            int expensivePermitLimit = configuration.GetValue("RateLimiting:Expensive:PermitLimit", 20);
            int expensiveWindowMinutes = configuration.GetValue("RateLimiting:Expensive:WindowMinutes", 1);
            int expensiveQueueLimit = configuration.GetValue("RateLimiting:Expensive:QueueLimit", 0);

            options.AddPolicy(
                "expensive",
                httpContext => RateLimitingRolePartitionBuilder.CreateFixedWindow(
                    httpContext,
                    expensivePermitLimit,
                    expensiveWindowMinutes,
                    expensiveQueueLimit,
                    "expensive"));

            int replayLightPermitLimit = configuration.GetValue("RateLimiting:Replay:Light:PermitLimit", 60);
            int replayLightWindowMinutes = configuration.GetValue("RateLimiting:Replay:Light:WindowMinutes", 1);
            int replayHeavyPermitLimit = configuration.GetValue("RateLimiting:Replay:Heavy:PermitLimit", 15);
            int replayHeavyWindowMinutes = configuration.GetValue("RateLimiting:Replay:Heavy:WindowMinutes", 1);

            options.AddPolicy("replay", httpContext =>
            {
                string fmt = httpContext.Request.Query["format"].ToString().Trim().ToLowerInvariant();
                bool isHeavy = fmt is "docx" or "pdf";
                TimeSpan window = TimeSpan.FromMinutes(isHeavy ? replayHeavyWindowMinutes : replayLightWindowMinutes);
                int permits = isHeavy ? replayHeavyPermitLimit : replayLightPermitLimit;

                string? user = httpContext.User.Identity?.Name;
                string key = string.IsNullOrWhiteSpace(user)
                    ? httpContext.Connection.RemoteIpAddress?.ToString() ?? "anonymous"
                    : user;

                string partitionKey = $"{key}:{(isHeavy ? "heavy" : "light")}";
                return RateLimitPartition.GetFixedWindowLimiter(
                    partitionKey,
                    _ => new FixedWindowRateLimiterOptions { PermitLimit = permits, Window = window, QueueLimit = 0 });
            });

            int governancePolicyPackDryRunPermitLimit = configuration.GetValue(
                "RateLimiting:GovernancePolicyPackDryRun:PermitLimit",
                RateLimitingDefaults.GovernancePolicyPackDryRunPermitLimit);
            int governancePolicyPackDryRunWindowMinutes = configuration.GetValue(
                "RateLimiting:GovernancePolicyPackDryRun:WindowMinutes", 1);
            int governancePolicyPackDryRunQueueLimit =
                configuration.GetValue("RateLimiting:GovernancePolicyPackDryRun:QueueLimit", 0);

            options.AddPolicy(
                "governancePolicyPackDryRun",
                httpContext =>
                {
                    string? nameId = httpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                    string userId = !string.IsNullOrWhiteSpace(nameId)
                        ? nameId
                        : httpContext.User.Identity?.Name
                          ?? httpContext.Connection.RemoteIpAddress?.ToString()
                          ?? "anonymous";

                    return RateLimitPartition.GetFixedWindowLimiter(
                        $"governancePolicyPackDryRun:{userId}",
                        _ => new FixedWindowRateLimiterOptions
                        {
                            PermitLimit = governancePolicyPackDryRunPermitLimit,
                            Window = TimeSpan.FromMinutes(governancePolicyPackDryRunWindowMinutes),
                            QueueLimit = governancePolicyPackDryRunQueueLimit
                        });
                });

            int evidenceBulkPermitLimit = configuration.GetValue(
                "RateLimiting:EvidenceBulkUpload:PermitLimit",
                RateLimitingDefaults.EvidenceBulkUploadPermitLimit);
            int evidenceBulkWindowMinutes =
                configuration.GetValue("RateLimiting:EvidenceBulkUpload:WindowMinutes", 1);
            int evidenceBulkQueueLimit =
                configuration.GetValue("RateLimiting:EvidenceBulkUpload:QueueLimit", 0);

            options.AddPolicy(
                "evidenceBulkUpload",
                httpContext =>
                {
                    IEvidenceBulkUploadAnomalyTracker? anomalyTracker =
                        httpContext.RequestServices.GetService<IEvidenceBulkUploadAnomalyTracker>();
                    string clientKey = RateLimitingRolePartitionBuilder.ResolveClientPartitionKey(httpContext);
                    double anomalyMultiplier = anomalyTracker?.GetPermitLimitMultiplier(clientKey) ?? 1.0;

                    return RateLimitingRolePartitionBuilder.CreateFixedWindow(
                        httpContext,
                        evidenceBulkPermitLimit,
                        evidenceBulkWindowMinutes,
                        evidenceBulkQueueLimit,
                        "evidenceBulkUpload",
                        anomalyMultiplier);
                });
        });
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
