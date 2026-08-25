namespace ArchLucid.Contracts.Findings;

public enum FindingMergeConflictResolutionAction
{
    AcceptPrimary,
    AcceptAlternate,
    KeepBoth,
}

public sealed class ResolveFindingMergeConflictRequest
{
    public FindingMergeConflictResolutionAction Action
    {
        get;
        set;
    } = FindingMergeConflictResolutionAction.AcceptPrimary;
}
