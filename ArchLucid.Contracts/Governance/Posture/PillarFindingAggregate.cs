namespace ArchLucid.Contracts.Governance.Posture;

/// <summary>
///     Severity and disposition counts for one architecture pillar in the posture overview (TB-2375).
///     Counts only — no score, ratio, or grade.
/// </summary>
public sealed class PillarFindingAggregate
{
    public string PillarKey
    {
        get;
        init;
    } = null!;

    public int CriticalCount
    {
        get;
        init;
    }

    public int ErrorCount
    {
        get;
        init;
    }

    public int WarningCount
    {
        get;
        init;
    }

    public int InfoCount
    {
        get;
        init;
    }

    public int DispositionedCount
    {
        get;
        init;
    }

    public int MutedCount
    {
        get;
        init;
    }
}
