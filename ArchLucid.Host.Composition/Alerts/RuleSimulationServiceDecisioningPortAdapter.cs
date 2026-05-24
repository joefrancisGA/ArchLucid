using ArchLucid.Contracts.Alerts.Simulation;

namespace ArchLucid.Host.Composition.Alerts;

/// <summary>
///     Forwards <see cref="ArchLucid.Decisioning.Alerts.Simulation.IRuleSimulationService" /> to the Core simulation port.
/// </summary>
internal sealed class RuleSimulationServiceDecisioningPortAdapter(ArchLucid.Core.Alerts.Simulation.IRuleSimulationService inner)
    : ArchLucid.Decisioning.Alerts.Simulation.IRuleSimulationService
{
    private readonly ArchLucid.Core.Alerts.Simulation.IRuleSimulationService _inner =
        inner ?? throw new ArgumentNullException(nameof(inner));

    public Task<RuleSimulationResult> SimulateAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        RuleSimulationRequest request,
        CancellationToken ct) =>
        _inner.SimulateAsync(tenantId, workspaceId, projectId, request, ct);

    public Task<RuleCandidateComparisonResult> CompareCandidatesAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        RuleCandidateComparisonRequest request,
        CancellationToken ct) =>
        _inner.CompareCandidatesAsync(tenantId, workspaceId, projectId, request, ct);
}
