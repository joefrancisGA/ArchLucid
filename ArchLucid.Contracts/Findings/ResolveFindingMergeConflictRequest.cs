namespace ArchLucid.Contracts.Findings;

public enum FindingMergeConflictResolutionAction
{
    AcceptPrimary,
    AcceptAlternate,
    KeepBoth,
}

public sealed class ResolveFindingMergeConflictRequest
{
    public required FindingMergeConflictResolutionAction Action
    {
        get;
        init;
    }
}
