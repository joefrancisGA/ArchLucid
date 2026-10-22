namespace ArchLucid.Application.Findings;

/// <summary>Outcome of resolving a <c>FindingMergeConflict</c> row on a run snapshot.</summary>
public enum FindingMergeConflictResolveResult
{
    /// <summary>Conflict was resolved and snapshot was updated.</summary>
    Resolved,

    /// <summary>Conflict was already resolved (idempotent operator retry).</summary>
    AlreadyResolved,

    /// <summary>No matching merge conflict for run / finding id.</summary>
    NotFound,
}
