using ArchLucid.Contracts.Alerts.Composite;

namespace ArchLucid.Core.Alerts.Composite;

public interface IAlertMetricSnapshotBuilder
{
    AlertMetricSnapshot Build(AlertEvaluationContext context);
}
