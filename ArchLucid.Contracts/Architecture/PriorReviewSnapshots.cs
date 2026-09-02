namespace ArchLucid.Contracts.Architecture;

/// <summary>
///     Typed prior revision pinned for cross-run finding engines and incremental re-review.
/// </summary>
public sealed class PriorReviewSnapshots
{
    public Guid? PriorArchitectureVersionId
    {
        get;
        set;
    }

    public Guid? PriorGraphSnapshotId
    {
        get;
        set;
    }

    public Guid? PriorFindingsSnapshotId
    {
        get;
        set;
    }

    public Guid? PriorRunId
    {
        get;
        set;
    }
}
