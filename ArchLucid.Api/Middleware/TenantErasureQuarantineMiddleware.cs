using ArchLucid.Api.ProblemDetails;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

namespace ArchLucid.Api.Middleware;

/// <summary>
///     Blocks tenant-scoped traffic while erasure quarantine is active
///     (<c>OffboardedUtc</c> or past-due <c>TenantErasureRequestedUtc</c>).
/// </summary>
internal sealed class TenantErasureQuarantineMiddleware(RequestDelegate next)
{
    private static bool Skip(PathString path)
    {
        if (path == "/" || path.StartsWithSegments("/robots.txt", StringComparison.OrdinalIgnoreCase) ||
            path.StartsWithSegments("/sitemap.xml", StringComparison.OrdinalIgnoreCase))
            return true;

        return path.StartsWithSegments("/health", StringComparison.OrdinalIgnoreCase) ||
               path.StartsWithSegments("/version", StringComparison.OrdinalIgnoreCase) ||
               path.StartsWithSegments("/openapi", StringComparison.OrdinalIgnoreCase) ||
               path.StartsWithSegments("/swagger", StringComparison.OrdinalIgnoreCase) ||
               path.StartsWithSegments("/scalar", StringComparison.OrdinalIgnoreCase) ||
               path.StartsWithSegments("/v1/register", StringComparison.OrdinalIgnoreCase) ||
               path.StartsWithSegments("/v1/admin", StringComparison.OrdinalIgnoreCase);
    }

    /// <summary>Runs after authentication; denies tenant routes during erasure quarantine.</summary>
    public async Task InvokeAsync(HttpContext context)
    {
        if (Skip(context.Request.Path) || context.User.Identity?.IsAuthenticated != true)
        {
            await next(context);

            return;
        }

        IScopeContextProvider scopes = context.RequestServices.GetRequiredService<IScopeContextProvider>();
        ScopeContext scope = scopes.GetCurrentScope();

        if (scope.TenantId == Guid.Empty)
        {
            await next(context);

            return;
        }

        ITenantRepository tenants = context.RequestServices.GetRequiredService<ITenantRepository>();
        TenantRecord? tenant = await tenants.GetByIdAsync(scope.TenantId, context.RequestAborted);
        TimeProvider timeProvider = context.RequestServices.GetRequiredService<TimeProvider>();
        DateTimeOffset utcNow = timeProvider.GetUtcNow();

        if (tenant is null || !TenantErasureEligibility.IsTenantLoginBlocked(tenant, utcNow))
        {
            await next(context);

            return;
        }

        Microsoft.AspNetCore.Mvc.ProblemDetails problem = new()
        {
            Type = ProblemTypes.TenantErasureQuarantine,
            Title = "Tenant erasure quarantine",
            Status = StatusCodes.Status403Forbidden,
            Detail = "This tenant is in scheduled erasure quarantine and cannot access APIs.",
            Instance = context.Request.Path.Value
        };

        ProblemErrorCodes.AttachErrorCode(problem, ProblemTypes.TenantErasureQuarantine);
        ProblemSupportHints.AttachForProblemType(problem);
        ProblemCorrelation.Attach(problem, context);

        context.Response.StatusCode = StatusCodes.Status403Forbidden;
        context.Response.ContentType = ApplicationProblemMapper.ProblemJsonMediaType;
        await context.Response.WriteAsJsonAsync(problem, context.RequestAborted);
    }
}
