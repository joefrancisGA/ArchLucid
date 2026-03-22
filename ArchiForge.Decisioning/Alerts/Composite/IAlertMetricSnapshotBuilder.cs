using ArchiForge.Decisioning.Alerts;

namespace ArchiForge.Decisioning.Alerts.Composite;

public interface IAlertMetricSnapshotBuilder
{
    AlertMetricSnapshot Build(AlertEvaluationContext context);
}
