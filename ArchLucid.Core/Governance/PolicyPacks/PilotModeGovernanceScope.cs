using ArchLucid.Contracts.Common;

namespace ArchLucid.Core.Governance.PolicyPacks;

/// <summary>
///     Async-local scope activated for architecture runs that request focused pilot policy packs.
/// </summary>
public readonly struct PilotModeGovernanceScope : IDisposable
{
    private static readonly AsyncLocal<bool> Active = new();
    private static readonly AsyncLocal<CloudProvider> RunCloudProvider = new();

    /// <summary>True when the current async flow should limit effective governance to focused pilot packs.</summary>
    public static bool IsActive => Active.Value;

    /// <summary>Cloud target for the active focused-review scope (defaults to <see cref="CloudProvider.None" />).</summary>
    public static CloudProvider ActiveCloudProvider => RunCloudProvider.Value;

    /// <summary>Activates focused pilot governance for the current async flow.</summary>
    public static PilotModeGovernanceScope Begin(CloudProvider cloudProvider = CloudProvider.None)
    {
        Active.Value = true;
        RunCloudProvider.Value = cloudProvider;

        return new PilotModeGovernanceScope();
    }

    /// <summary>
    ///     Activates focused pilot governance when <paramref name="policyReferences" /> includes
    ///     <see cref="FocusedPilotModePolicyPacks.ReferenceToken" />; otherwise pins only the run cloud target when known.
    /// </summary>
    public static IDisposable BeginFromPolicyReferences(
        IEnumerable<string>? policyReferences,
        CloudProvider cloudProvider = CloudProvider.None)
    {
        if (FocusedPilotModePolicyPacks.ReferencesIncludeFocusedPilotToken(policyReferences))
            return Begin(cloudProvider);

        if (cloudProvider != CloudProvider.None)
            return BeginCloudTarget(cloudProvider);

        return NoOpDisposable.Instance;
    }

    /// <summary>Pins the run cloud target for applicability filtering without enabling focused pilot mode.</summary>
    public static IDisposable BeginCloudTarget(CloudProvider cloudProvider)
    {
        RunCloudProvider.Value = cloudProvider;

        return CloudTargetScope.Instance;
    }

    /// <inheritdoc />
    public void Dispose()
    {
        Active.Value = false;
        RunCloudProvider.Value = CloudProvider.None;
    }

    private sealed class NoOpDisposable : IDisposable
    {
        internal static readonly NoOpDisposable Instance = new();

        public void Dispose()
        {
        }
    }

    private sealed class CloudTargetScope : IDisposable
    {
        internal static readonly CloudTargetScope Instance = new();

        public void Dispose()
        {
            RunCloudProvider.Value = CloudProvider.None;
        }
    }
}
