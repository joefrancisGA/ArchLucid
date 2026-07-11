using ArchLucid.Api.Auth.Models;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

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
///     allow the request when <see cref="ArchLucidAuthOptions.AllowTestActorHeaders" /> is enabled.
/// </summary>
public sealed class CommercialTenantTierFilter(
    TenantTier minimumTier,
    ITenantRepository tenantRepository,
    IScopeContextProvider scopeContextProvider,
    IWebHostEnvironment hostEnvironment,
    IOptions<ArchLucidAuthOptions> authOptions) : IAsyncActionFilter
{
    private readonly ArchLucidAuthOptions _authOptions =
        authOptions?.Value ?? throw new ArgumentNullException(nameof(authOptions));

    private readonly IWebHostEnvironment _hostEnvironment =
        hostEnvironment ?? throw new ArgumentNullException(nameof(hostEnvironment));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly ITenantRepository _tenantRepository =
        tenantRepository ?? throw new ArgumentNullException(nameof(tenantRepository));

    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        if (context.HttpContext.User.Identity?.IsAuthenticated is not true)
        {
            await next();

            return;
        }

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        TenantRecord? tenant = await _tenantRepository.GetByIdAsync(scope.TenantId, context.HttpContext.RequestAborted);

        if (tenant is null)
        {
            if (ShouldTreatMissingTenantAsStandardDevelopmentBypass(
                    _hostEnvironment.IsDevelopment(),
                    _authOptions.Mode,
                    _authOptions.AllowTestActorHeaders,
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

        if ((int)tenant.Tier < (int)minimumTier)
        {
            string? instancePath = context.HttpContext.Request.Path.Value;

            context.Result =
                MinimumTierDeniedShouldObfuscate(minimumTier)
                    ? PackagingTierProblemDetailsFactory.CreateObfuscatedNotFound(context.HttpContext, instancePath)
                    : PackagingTierProblemDetailsFactory.CreateTenantProductInsufficientTier(
                        context.HttpContext,
                        minimumTier,
                        instancePath);

            return;
        }

        await next();
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
        string? authMode,
        bool allowTestActorHeaders,
        TenantTier minimumTier)
    {
        if (minimumTier != TenantTier.Standard)
        {
            return false;
        }

        if (!isDevelopmentHost)
        {
            return false;
        }

        if (!string.Equals(authMode?.Trim(), "DevelopmentBypass", StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        return allowTestActorHeaders;
    }
}
