using ArchLucid.Application.Governance;

namespace ArchLucid.Application.Findings;

/// <summary>Options for <see cref="OpenCommitmentFindingEngine" />.</summary>
public sealed class OpenCommitmentFindingOptions
{
    public const string SectionPath = "ArchLucid:Findings:OpenCommitment";

    public bool Enabled
    {
        get;
        set;
    } = true;

    public TimeSpan Lookback
    {
        get;
        set;
    } = FindingDispositionTrailWindow.BasisBreakdownLookback;

    public int WaiverExpiryWarningDays
    {
        get;
        set;
    } = 30;

    public int MaxFindings
    {
        get;
        set;
    } = 25;
}
