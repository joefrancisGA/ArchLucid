namespace ArchLucid.Contracts.Governance;

/// <summary>Aggregated pre-finalize readiness for an architecture run.</summary>
public sealed class PreFinalizeChecklistResult
{
    public string RunId
    {
        get;
        init;
    } = null!;

    /// <summary>True when no checklist row is blocking finalize.</summary>
    public bool ReadyToFinalize
    {
        get;
        init;
    }

    public IReadOnlyList<PreFinalizeChecklistItem> Items
    {
        get;
        init;
    } = [];

    public int AdvisoryCount
    {
        get;
        init;
    }

    public int BlockingCount
    {
        get;
        init;
    }
}
