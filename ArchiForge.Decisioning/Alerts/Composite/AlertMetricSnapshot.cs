namespace ArchiForge.Decisioning.Alerts.Composite;

public class AlertMetricSnapshot
{
    public decimal CriticalRecommendationCount { get; set; }
    public decimal NewComplianceGapCount { get; set; }
    public decimal CostIncreasePercent { get; set; }
    public decimal DeferredHighPriorityRecommendationCount { get; set; }
    public decimal RejectedSecurityRecommendationCount { get; set; }
    public decimal AcceptanceRatePercent { get; set; }
}
