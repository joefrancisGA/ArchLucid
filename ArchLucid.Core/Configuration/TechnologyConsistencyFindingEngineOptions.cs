namespace ArchLucid.Core.Configuration;

/// <summary>
///     Feature gate for deterministic Technology Ledger consistency checks at pre-commit evaluation.
/// </summary>
public sealed class TechnologyConsistencyFindingEngineOptions
{
    public const string SectionPath = "ArchLucid:TechnologyConsistency:FindingEngine";

    /// <summary>When false, <see cref="TechnologyConsistencyFindingEngine" /> is not invoked.</summary>
    public bool Enabled
    {
        get;
        set;
    } = true;

    /// <summary>
    ///     Operational posture for emitted finding severities. Defaults to
    ///     <see cref="TechnologyConsistencyFindingEngineMode.WarnOnly" />.
    /// </summary>
    public TechnologyConsistencyFindingEngineMode Mode
    {
        get;
        set;
    } = TechnologyConsistencyFindingEngineMode.WarnOnly;

    public void Normalize()
    {
    }
}
