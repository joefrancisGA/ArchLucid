namespace ArchiForge.Decisioning.Alerts.Tuning;

public interface IThresholdRecommendationService
{
    Task<ThresholdRecommendationResult> RecommendAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        ThresholdRecommendationRequest request,
        CancellationToken ct);
}
