namespace ArchLucid.Application.Governance;

/// <summary>Response for governance approval-request batch review.</summary>
public sealed class GovernanceBatchReviewResponse
{
    public IReadOnlyList<GovernanceBatchReviewItemResult> Results { get; set; } = [];
}
