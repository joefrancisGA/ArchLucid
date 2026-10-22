namespace ArchLucid.Contracts.Drafts;

/// <summary>Branch quota and cost surfacing for <c>GET /v1/architecture/draft/{draftId}/branch-quota</c> (R12).</summary>
public sealed class DraftBranchQuotaResponse
{
    public Guid DraftId
    {
        get;
        set;
    }

    public int ExistingBranchCount
    {
        get;
        set;
    }

    public int MaxBranchesPerParent
    {
        get;
        set;
    }

    public int RemainingBranches
    {
        get;
        set;
    }

    public bool CanBranch
    {
        get;
        set;
    }

    /// <summary>Estimated USD cost per branch submit — operator-facing estimate, not billing truth.</summary>
    public decimal EstimatedBranchRunCostUsd
    {
        get;
        set;
    }
}
