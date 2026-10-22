namespace ArchLucid.Contracts.Findings;

/// <summary>Disposition counts for findings on a committed run (Batch B / governance stickiness).</summary>
public sealed class RunFindingDispositionCoverage
{
    public int OpenCount
    {
        get;
        init;
    }

    public int AcceptedCount
    {
        get;
        init;
    }

    public int DeferredCount
    {
        get;
        init;
    }

    public int NeedsEvidenceCount
    {
        get;
        init;
    }

    public int RemediatedCount
    {
        get;
        init;
    }

    public int RejectedNotApplicableCount
    {
        get;
        init;
    }

    public int WaivedCount
    {
        get;
        init;
    }
}
