namespace ArchLucid.Decisioning.Alerts.Composite;

/// <summary>Compatibility stub; canonical contract is <see cref="ArchLucid.Core.Alerts.Composite.IAlertMetricSnapshotBuilder" />.</summary>
public interface IAlertMetricSnapshotBuilder : ArchLucid.Core.Alerts.Composite.IAlertMetricSnapshotBuilder
{
    AlertMetricSnapshot Build(AlertEvaluationContext context);

    AlertMetricSnapshot ArchLucid.Core.Alerts.Composite.IAlertMetricSnapshotBuilder.Build(
        ArchLucid.Core.Alerts.AlertEvaluationContext context)
    {
        if (context is not AlertEvaluationContext decisioningContext)
            throw new InvalidOperationException("Expected Decisioning alert evaluation context.");

        return Build(decisioningContext);
    }
}
