using System.Diagnostics.CodeAnalysis;

namespace ArchLucid.Api.Contracts;

/// <summary>
///     Response for <c>GET /v1/advisory/runs/{runId}/recommendations</c> including persisted improve-loop evidence.
/// </summary>
[ExcludeFromCodeCoverage(Justification = "API contract DTO; no business logic.")]
public sealed class AdvisoryRunRecommendationsListResponse
{
    public List<RecommendationRecordResponse> Recommendations
    {
        get;
        set;
    } = [];

    public RecommendationImproveLoopEvidenceResponse? ImproveLoopEvidence
    {
        get;
        set;
    }
}
