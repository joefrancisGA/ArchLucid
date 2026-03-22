namespace ArchiForge.Decisioning.Alerts.Composite;

public interface ICompositeAlertRuleEvaluator
{
    bool Evaluate(CompositeAlertRule rule, AlertMetricSnapshot snapshot);
}
