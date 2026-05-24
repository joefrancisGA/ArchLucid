using ArchLucid.Contracts.Alerts;

namespace ArchLucid.Core.Alerts;

public interface IAlertEvaluator
{
    IReadOnlyList<AlertRecord> Evaluate(
        IReadOnlyList<AlertRule> rules,
        AlertEvaluationContext context);
}
