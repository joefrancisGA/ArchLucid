namespace ArchiForge.Decisioning.Alerts.Composite;

public interface IAlertSuppressionPolicy
{
    Task<AlertSuppressionDecision> DecideAsync(
        CompositeAlertRule rule,
        AlertEvaluationContext context,
        AlertMetricSnapshot snapshot,
        CancellationToken ct);
}
