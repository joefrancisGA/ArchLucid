namespace ArchLucid.Contracts.Governance;

/// <summary>
///     Server-side enforcement of the finalize quality scorecard (TB-2321). The UI scorecard blocks the
///     Finalize button on the same six dimensions; this gate makes the API reject finalize for direct callers too.
/// </summary>
public sealed class FinalizeQualityGateOptions
{
    public const string SectionPath = "ArchLucid:FinalizeQualityGate";

    /// <summary>Default unverified-assumption count that blocks finalize (matches the UI scorecard threshold).</summary>
    public const int DefaultUnverifiedAssumptionBlockThreshold = 3;

    /// <summary>When false (default), the scorecard gate is not evaluated during commit.</summary>
    public bool Enabled
    {
        get;
        set;
    }

    /// <summary>Open unverified assumptions at or above this count block finalize. Values below 1 disable the check.</summary>
    public int UnverifiedAssumptionBlockThreshold
    {
        get;
        set;
    } = DefaultUnverifiedAssumptionBlockThreshold;

    /// <summary>
    ///     Minimum severity for the unresolved-disposition and low-confidence dimensions
    ///     (<c>Error</c>, <c>Critical</c>, or <c>High</c> mapped to <see cref="Findings.FindingSeverity.Error" />).
    /// </summary>
    public string? MinimumUnresolvedSeverity
    {
        get;
        set;
    } = "Error";
}
