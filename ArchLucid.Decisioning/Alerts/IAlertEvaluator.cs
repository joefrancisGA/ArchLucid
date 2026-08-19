namespace ArchLucid.Decisioning.Alerts;

/// <summary>Compatibility stub; canonical contract is <see cref="ArchLucid.Core.Alerts.IAlertEvaluator" />.</summary>
public interface IAlertEvaluator : ArchLucid.Core.Alerts.IAlertEvaluator
{
    IReadOnlyList<AlertRecord> Evaluate(
        IReadOnlyList<AlertRule> rules,
        AlertEvaluationContext context);

    IReadOnlyList<AlertRecord> ArchLucid.Core.Alerts.IAlertEvaluator.Evaluate(
        IReadOnlyList<AlertRule> rules,
        ArchLucid.Core.Alerts.AlertEvaluationContext context)
    {
        if (context is not AlertEvaluationContext decisioningContext)
            throw new InvalidOperationException("Expected Decisioning alert evaluation context.");

        return Evaluate(rules, decisioningContext);
    }
}
