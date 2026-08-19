using System.Diagnostics.CodeAnalysis;

namespace ArchLucid.Api.Controllers.Governance;

/// <summary>Response for <c>POST /v1/governance/approval-requests/batch-review</c>.</summary>
[ExcludeFromCodeCoverage(Justification = "API request/response DTO; auto-properties only.")]
public sealed class GovernanceBatchReviewResponse
{
    public IReadOnlyList<GovernanceBatchReviewItemResult> Results
    {
        get;
        set;
    } = [];
}
