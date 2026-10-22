using ArchLucid.Contracts.Alerts;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Core.Alerts;

public interface IAlertService
{
    Task<AlertEvaluationOutcome> EvaluateAndPersistAsync(
        AlertEvaluationContext context,
        CancellationToken ct);

    /// <summary>Applies an operator action to an alert that belongs to <paramref name="scope" />.</summary>
    Task<AlertRecord?> ApplyActionAsync(
        ScopeContext scope,
        Guid alertId,
        string userId,
        string userName,
        AlertActionRequest request,
        CancellationToken ct);
}
