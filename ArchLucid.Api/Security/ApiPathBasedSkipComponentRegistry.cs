using System.Reflection;

namespace ArchLucid.Api.Security;

/// <summary>
///     Documents API components that apply path-prefix skip/allow rules guarded by <see cref="ApiPathSkipSafety" />.
/// </summary>
public static class ApiPathBasedSkipComponentRegistry
{
    public static IReadOnlyList<string> ComponentIds { get; } =
    [
        "ScopeResolutionGuardMiddleware.ShouldSkip",
        "TenantErasureQuarantineMiddleware.Skip",
        "TrialSeatReservationMiddleware.SkipSeatAccounting",
        "ProductLineRouteGatePathClassifier.ShouldSkip",
        "RouteTenantScopeBindingFilter.ShouldSkip",
        "ApiRequestMeteringMiddleware.InvokeAsync",
        "ScopeIdentityBindingMiddleware.TryAuthenticateScimBearerForScopeBindingAsync",
        "ContextIngestionMaxPayloadMiddleware.LooksLikeArchitectureCreateRun",
    ];

    public static IReadOnlyList<Type> MiddlewareTypesInAssembly { get; } =
        typeof(ApiPathBasedSkipComponentRegistry).Assembly
            .GetTypes()
            .Where(static type => type.Namespace == "ArchLucid.Api.Middleware" && type.Name.EndsWith("Middleware", StringComparison.Ordinal))
            .OrderBy(static type => type.FullName, StringComparer.Ordinal)
            .ToList();

    public static IReadOnlyList<Type> FilterTypesWithPathSkipInAssembly { get; } =
        typeof(ApiPathBasedSkipComponentRegistry).Assembly
            .GetTypes()
            .Where(static type =>
                type.Namespace == "ArchLucid.Api.Security"
                && type.Name.EndsWith("Filter", StringComparison.Ordinal)
                && type.GetMethods(BindingFlags.Instance | BindingFlags.NonPublic | BindingFlags.Static | BindingFlags.Public)
                    .Any(static method => method.Name.Contains("ShouldSkip", StringComparison.Ordinal)))
            .OrderBy(static type => type.FullName, StringComparer.Ordinal)
            .ToList();
}
