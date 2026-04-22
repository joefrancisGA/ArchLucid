using ArchLucid.Api.Filters;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Attributes;

/// <summary>
///     Hides a route behind a per-deployment feature toggle (<see cref="FeatureGateKey" />).
///     When the toggle is off, the configured <see cref="FeatureGateFilter" /> short-circuits the action with
///     <c>404 Not Found</c> Problem Details — production deployments cannot expose demo-only surfaces by accident.
/// </summary>
/// <remarks>
///     Mirrors the <see cref="RequiresCommercialTenantTierAttribute" /> shape: a thin <see cref="TypeFilterAttribute" />
///     that forwards the gate key as the first positional argument so the filter's other dependencies stay DI-resolved.
/// </remarks>
public sealed class FeatureGateAttribute : TypeFilterAttribute
{
    /// <summary>Wires <paramref name="key" /> into <see cref="FeatureGateFilter" />'s primary constructor.</summary>
    /// <param name="key">Feature toggle the action requires.</param>
    public FeatureGateAttribute(FeatureGateKey key)
        : base(typeof(FeatureGateFilter))
    {
        Arguments = [key];
    }
}
