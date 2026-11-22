using System;
using System.Threading;
using System.Threading.Tasks;

namespace ArchLucid.Core.Configuration;

/// <summary>
/// Fail-closed gate for future 2.0 experimental capabilities. No current runtime
/// feature is registered through this gate; adding one requires explicit wiring,
/// authorization and release review.
/// </summary>
public static class ExperimentalCapabilityGate
{
    public const string GlobalKillSwitch = "ArchLucid:Experimental2:KillSwitch";

    /// <summary>
    /// Both a global enable and a named capability enable are necessary; an
    /// emergency kill switch takes precedence. No flag alone confers authority.
    /// </summary>
    public static async Task<bool> IsAllowedAsync(
        string capability,
        bool globalEnabled,
        bool killSwitch,
        bool tenantAuthorized,
        IFeatureFlags featureFlags,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(capability);
        ArgumentNullException.ThrowIfNull(featureFlags);

        if (!globalEnabled || killSwitch || !tenantAuthorized)
            return false;

        // Only explicitly declared experimental capabilities may be evaluated.
        if (capability != "ArchitectureAnalysisV2"
            && capability != "SecurityEvidenceV2"
            && capability != "ExtensionDiscoveryV2")
            return false;

        return await featureFlags.IsEnabledAsync("Experimental2:" + capability, cancellationToken);
    }
}
