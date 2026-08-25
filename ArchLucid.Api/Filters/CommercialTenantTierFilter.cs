using ArchLucid.Api.Auth.Models;
using ArchLucid.Api.Diagnostics;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Host.Core.Configuration;

using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Options;

namespace ArchLucid.Api.Filters;

/// <summary>
///     Enforces a minimum <see cref="TenantTier" /> for the current scope (loaded from <c>dbo.Tenants</c>).
///     Returns <c>404 Not Found</c> for Enterprise-only entitlement gates (enumeration suppression); <c>403 Forbidden</c>
///     with Problem Details when the minimum tier is Standard (tenant-visible commercial capabilities).
///     In DevelopmentBypass live E2E, arbitrary scope ids may have no <c>dbo.Tenants</c> row — Standard gates still
///     allow the request on Development hosts (see <c>freshIsolatedTenantScope</c> in live Playwright helpers).
/// </summary>
public sealed class CommercialTenantTierFilter(
    TenantTier minimumTier,
    ITenantRepository tenantRepository,
    IScopeContextProvider scopeContextProvider,
    IWebHostEnvironment hostEnvironment,
    IOptions<ArchLucidAuthOptions> authOptions,
    IOptions<E2EHarnessOptions> e2eHarnessOptions) : IAsyncActionFilter
{
    private readonly ArchLucidAuthOptions _authOptions =
        authOptions?.Value ?? throw new ArgumentNullException(nameof(authOptions));

    private readonly E2EHarnessOptions _e2eHarnessOptions =
        e2eHarnessOptions?.Value ?? throw new ArgumentNullException(nameof(e2eHarnessOptions));

    private readonly IWebHostEnvironment _hostEnvironment =
        hostEnvironment ?? throw new ArgumentNullException(nameof(hostEnvironment));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly ITenantRepository _tenantRepository =
        tenantRepository ?? throw new ArgumentNullException(nameof(tenantRepository));

    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        InteractiveReadHangKind hangKind = InteractiveReadHangTrace.Classify(
            context.HttpContext.Request.Method,
            context.HttpContext.Request.Path.Value);

        TraceHang(
            hangKind,
            "tier_filter_entered",
            ("correlationId", context.HttpContext.TraceIdentifier),
            ("path", context.HttpContext.Request.Path.Value),
            ("isAuthenticated", context.HttpContext.User.Identity?.IsAuthenticated == true));

        if (context.HttpContext.User.Identity?.IsAuthenticated is not true)
        {
            await next();

            return;
        }

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        CancellationToken cancellationToken = context.HttpContext.RequestAborted;

        TraceHang(
            hangKind,
            "tier_filter_tenant_lookup_started",
            ("correlationId", context.HttpContext.TraceIdentifier),
            ("tenantId", scope.TenantId));

        long tenantLookupStartedMs = Environment.TickCount64;
        TenantRecord? tenant = await _tenantRepository.GetByIdAsync(scope.TenantId, cancellationToken);

        if (tenant is null)
        {
            tenant = await _tenantRepository.GetByIdFromControlPlaneCatalogAsync(scope.TenantId, cancellationToken);
        }

        TraceHang(
            hangKind,
            "tier_filter_tenant_lookup_completed",
            ("correlationId", context.HttpContext.TraceIdentifier),
            ("durationMs", Environment.TickCount64 - tenantLookupStartedMs),
            ("tenantFound", tenant is not null),
            ("tenantTier", tenant?.Tier.ToString()));

        if (tenant is null)
        {
            if (ShouldTreatMissingTenantAsStandardDevelopmentBypass(
                    _hostEnvironment.IsDevelopment(),
                    !_hostEnvironment.IsProduction(),
                    _authOptions.Mode,
                    IsLiveE2eHarnessConfigured(_e2eHarnessOptions),
                    minimumTier))
            {
                await next();

                return;
            }

            Microsoft.AspNetCore.Mvc.ProblemDetails problem = new()
            {
                Type = ProblemTypes.ResourceNotFound,
                Title = "Not Found",
                Status = StatusCodes.Status404NotFound,
                Detail = "The requested resource was not found.",
                Instance = context.HttpContext.Request.Path.Value
            };

            ProblemErrorCodes.AttachErrorCode(problem, problem.Type);
            ProblemSupportHints.AttachForProblemType(problem);
            ProblemCorrelation.Attach(problem, context.HttpContext);
            context.Result = new ObjectResult(problem)
            {
                StatusCode = problem.Status, ContentTypes = { ApplicationProblemMapper.ProblemJsonMediaType }
            };

            return;
        }

        if (!CommercialTenantEligibility.MeetsCommercialTenantTierGate(tenant, minimumTier))
        {
            string? instancePath = context.HttpContext.Request.Path.Value;

            TraceHang(
                hangKind,
                "tier_filter_denied",
                ("correlationId", context.HttpContext.TraceIdentifier),
                ("minimumTier", minimumTier.ToString()));

            context.Result =
                MinimumTierDeniedShouldObfuscate(minimumTier)
                    ? PackagingTierProblemDetailsFactory.CreateObfuscatedNotFound(context.HttpContext, instancePath)
                    : PackagingTierProblemDetailsFactory.CreateTenantProductInsufficientTier(
                        context.HttpContext,
                        minimumTier,
                        instancePath);

            return;
        }

        TraceHang(
            hangKind,
            "tier_filter_allowing_request",
            ("correlationId", context.HttpContext.TraceIdentifier));

        await next();
    }

    private static void TraceHang(
        InteractiveReadHangKind hangKind,
        string eventName,
        params (string Key, object? Value)[] fields)
    {
        if (hangKind == InteractiveReadHangKind.None)
            return;

        ConsoleHangDiagnostics.Log(InteractiveReadHangTrace.ResolveComponent(hangKind), eventName, fields);
    }

    private static bool MinimumTierDeniedShouldObfuscate(TenantTier minimumTier)
    {
        return minimumTier == TenantTier.Enterprise;
    }

    /// <summary>
    ///     Live E2E uses <c>freshIsolatedTenantScope</c> without provisioning <c>dbo.Tenants</c>; only Standard commercial
    ///     gates may proceed in that harness.
    /// </summary>
    internal static bool ShouldTreatMissingTenantAsStandardDevelopmentBypass(
        bool isDevelopmentHost,
        bool isNonProductionHost,
        string? authMode,
        bool liveE2eHarnessConfigured,
        TenantTier minimumTier)
    {
        if (minimumTier != TenantTier.Standard)
        {
            return false;
        }

        if (string.Equals(authMode?.Trim(), "DevelopmentBypass", StringComparison.OrdinalIgnoreCase))
        {
            if (isDevelopmentHost)
            {
                return true;
            }

            if (isNonProductionHost && liveE2eHarnessConfigured)
            {
                return true;
            }
        }

        // ApiKey/JWT live E2E jobs share the same greenfield SQL catalog without dbo.Tenants rows for default scope.

        if (isDevelopmentHost && liveE2eHarnessConfigured)
        {
            return true;
        }

        return false;
    }

    private static bool IsLiveE2eHarnessConfigured(E2EHarnessOptions options)
    {
        string secret = options.SharedSecret?.Trim() ?? string.Empty;

        return secret.Length >= 16;
    }
}
