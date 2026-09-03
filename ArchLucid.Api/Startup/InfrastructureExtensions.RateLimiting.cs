using System.Security.Claims;
using System.Threading.RateLimiting;

using ArchLucid.Core.Configuration;
using ArchLucid.Core.Evidence;
using ArchLucid.Host.Core.Configuration;

using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace ArchLucid.Api.Startup;

internal static partial class InfrastructureExtensions
{
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
            ConfigureRateLimitRejection(options);
            ConfigureRateLimitPolicies(options, configuration);
        });

        return services;
    }

    private static void ConfigureRateLimitPolicies(RateLimiterOptions options, IConfiguration configuration)
    {
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
                    ?? httpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
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
    }
}
