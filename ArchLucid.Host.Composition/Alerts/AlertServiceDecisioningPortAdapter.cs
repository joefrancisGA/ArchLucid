using ArchLucid.Contracts.Alerts;

namespace ArchLucid.Host.Composition.Alerts;

/// <summary>
///     Forwards <see cref="ArchLucid.Decisioning.Alerts.IAlertService" /> to the Core alert port implemented in Persistence.
/// </summary>
internal sealed class AlertServiceDecisioningPortAdapter(ArchLucid.Core.Alerts.IAlertService inner)
    : ArchLucid.Decisioning.Alerts.IAlertService
{
    private readonly ArchLucid.Core.Alerts.IAlertService _inner =
        inner ?? throw new ArgumentNullException(nameof(inner));

    public Task<AlertEvaluationOutcome> EvaluateAndPersistAsync(
        ArchLucid.Core.Alerts.AlertEvaluationContext context,
        CancellationToken ct) =>
        _inner.EvaluateAndPersistAsync(context, ct);

    public Task<AlertRecord?> ApplyActionAsync(
        Guid alertId,
        string userId,
        string userName,
        AlertActionRequest request,
        CancellationToken ct) =>
        _inner.ApplyActionAsync(alertId, userId, userName, request, ct);
}
