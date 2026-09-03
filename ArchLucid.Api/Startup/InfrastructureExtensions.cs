using ArchLucid.Api.Filters;
using ArchLucid.Host.Core.Authorization;
using ArchLucid.Host.Core.Startup;

using Microsoft.AspNetCore.Authorization;

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
}
