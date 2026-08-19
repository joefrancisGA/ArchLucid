namespace ArchLucid.Core.Persistence;

/// <summary>
///     Thrown when a caller attempts to mutate committed run-header evidence anchors on <c>dbo.Runs</c> (TB-310).
/// </summary>
public sealed class RunEvidenceAnchorImmutableException : InvalidOperationException
{
    /// <summary>Creates an exception for the given run id.</summary>
    public RunEvidenceAnchorImmutableException(Guid runId)
        : base($"Run '{runId:D}' is committed; evidence-anchor header columns are immutable.")
    {
        RunId = runId;
    }

    /// <summary>Run whose header anchors could not be mutated.</summary>
    public Guid RunId
    {
        get;
    }
}
