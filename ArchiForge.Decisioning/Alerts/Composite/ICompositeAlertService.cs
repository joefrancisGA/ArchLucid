using ArchiForge.Decisioning.Alerts;

namespace ArchiForge.Decisioning.Alerts.Composite;

public interface ICompositeAlertService
{
    Task<CompositeAlertEvaluationResult> EvaluateAndPersistAsync(
        AlertEvaluationContext context,
        CancellationToken ct);
}
