namespace ArchLucid.Core.Governance.PolicyPacks;

/// <summary>
///     Async-local scope activated for architecture runs that request focused pilot policy packs.
/// </summary>
public readonly struct PilotModeGovernanceScope : IDisposable
{
    private static readonly AsyncLocal<bool> Active = new();

    /// <summary>True when the current async flow should limit effective governance to focused pilot packs.</summary>
    public static bool IsActive => Active.Value;

    /// <summary>Activates focused pilot governance for the current async flow.</summary>
    public static PilotModeGovernanceScope Begin()
    {
        Active.Value = true;

        return new PilotModeGovernanceScope();
    }

    /// <summary>
    ///     Activates focused pilot governance when <paramref name="policyReferences" /> includes
    ///     <see cref="FocusedPilotModePolicyPacks.ReferenceToken" />; otherwise returns a no-op disposable.
    /// </summary>
    public static IDisposable BeginFromPolicyReferences(IEnumerable<string>? policyReferences)
    {
        if (!FocusedPilotModePolicyPacks.ReferencesIncludeFocusedPilotToken(policyReferences))
            return NoOpDisposable.Instance;

        return Begin();
    }

    /// <inheritdoc />
    public void Dispose()
    {
        Active.Value = false;
    }

    private sealed class NoOpDisposable : IDisposable
    {
        internal static readonly NoOpDisposable Instance = new();

        public void Dispose()
        {
        }
    }
}
