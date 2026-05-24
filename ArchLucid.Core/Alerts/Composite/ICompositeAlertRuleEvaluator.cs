using ArchLucid.Contracts.Alerts.Composite;

namespace ArchLucid.Core.Alerts.Composite;

public interface ICompositeAlertRuleEvaluator
{
    bool Evaluate(CompositeAlertRule rule, AlertMetricSnapshot snapshot);
}
