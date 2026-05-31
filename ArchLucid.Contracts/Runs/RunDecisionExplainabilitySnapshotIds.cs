namespace ArchLucid.Contracts.Runs;

/// <summary>Snapshot identifiers shared across authority and coordinator decision explainability (TB-054).</summary>
public sealed class RunDecisionExplainabilitySnapshotIds
{
    public Guid? ContextSnapshotId
    {
        get;
        set;
    }

    public Guid? GraphSnapshotId
    {
        get;
        set;
    }

    public Guid? FindingsSnapshotId
    {
        get;
        set;
    }
}
