using ArchLucid.Core.Scoping;

namespace ArchLucid.Api.Security;

/// <summary>
///     Evaluates whether resolved scope is trusted enough for production-like hosts (TB-304).
/// </summary>
public static class ScopeResolutionGuard
{
    /// <summary>
    ///     True when any dimension was resolved from headers, development defaults, or ambient overrides carrying
    ///     development-default GUIDs.
    /// </summary>
    internal static bool RequiresTrustedScopeRejection(ScopeResolution resolution)
    {
        ArgumentNullException.ThrowIfNull(resolution);

        if (IsUntrusted(resolution.Tenant))
            return true;

        if (IsUntrusted(resolution.Workspace))
            return true;

        if (IsUntrusted(resolution.Project))
            return true;

        return false;
    }

    private static bool IsUntrusted(ScopeDimensionResolution dimension)
    {
        if (dimension.Source is ScopeSource.Header or ScopeSource.Default)
            return true;

        if (ScopeIds.IsDevelopmentDefault(dimension.Value)
            && dimension.Source is ScopeSource.Ambient or ScopeSource.Claim)
            return true;

        return false;
    }
}
