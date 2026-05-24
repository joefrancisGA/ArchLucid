using ArchLucid.Contracts.Alerts.Composite;

namespace ArchLucid.Host.Composition.Alerts;

/// <summary>
///     Forwards <see cref="ArchLucid.Decisioning.Alerts.Composite.ICompositeAlertService" /> to the Core composite alert port.
/// </summary>
internal sealed class CompositeAlertServiceDecisioningPortAdapter(ArchLucid.Core.Alerts.Composite.ICompositeAlertService inner)
    : ArchLucid.Decisioning.Alerts.Composite.ICompositeAlertService
{
    private readonly ArchLucid.Core.Alerts.Composite.ICompositeAlertService _inner =
        inner ?? throw new ArgumentNullException(nameof(inner));

    public Task<CompositeAlertEvaluationResult> EvaluateAndPersistAsync(
        ArchLucid.Core.Alerts.AlertEvaluationContext context,
        CancellationToken ct) =>
        _inner.EvaluateAndPersistAsync(context, ct);
}
