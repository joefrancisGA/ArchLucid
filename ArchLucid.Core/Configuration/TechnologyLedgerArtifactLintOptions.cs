namespace ArchLucid.Core.Configuration;

/// <summary>
///     Feature gate for deterministic Technology Ledger prose lint at artifact synthesis time.
/// </summary>
public sealed class TechnologyLedgerArtifactLintOptions
{
    public const string SectionPath = "ArchLucid:TechnologyConsistency:ArtifactLint";

    /// <summary>When false, <see cref="TechnologyLedgerArtifactLinter" /> is not invoked.</summary>
    public bool Enabled
    {
        get;
        set;
    } = true;

    /// <summary>
    ///     Operational posture for lint outcomes. Defaults to
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
