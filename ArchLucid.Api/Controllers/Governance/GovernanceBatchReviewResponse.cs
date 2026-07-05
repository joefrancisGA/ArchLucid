namespace ArchLucid.Api.Controllers.Governance;

/// <summary>Response for <c>POST /v1/governance/approval-requests/batch-review</c>.</summary>
public sealed class GovernanceBatchReviewResponse
{
    public IReadOnlyList<GovernanceBatchReviewItemResult> Results
    {
        get;
        set;
    } = [];
}
