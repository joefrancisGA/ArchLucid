using ArchLucid.Contracts.Alerts.Tuning;

namespace ArchLucid.Core.Alerts.Tuning;

public interface IThresholdRecommendationService
{
    Task<ThresholdRecommendationResult> RecommendAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        ThresholdRecommendationRequest request,
        CancellationToken ct);
}
