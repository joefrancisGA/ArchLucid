using ArchLucid.Contracts.Alerts.Composite;

namespace ArchLucid.Core.Alerts.Composite;

public interface ICompositeAlertService
{
    Task<CompositeAlertEvaluationResult> EvaluateAndPersistAsync(
        AlertEvaluationContext context,
        CancellationToken ct);
}
