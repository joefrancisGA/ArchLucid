using ArchLucid.Contracts.Alerts;
using ArchLucid.Contracts.Alerts.Composite;
using ArchLucid.Contracts.Alerts.Delivery;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Core.Persistence.Ports;

/// <summary>
///     CRUD and scoped queries for simple (non-composite) <see cref="AlertRule" /> definitions stored per
///     tenant/workspace/project.
/// </summary>
/// <remarks>
///     After loading, <c>AlertService</c> applies <c>PolicyPackGovernanceFilter.FilterAlertRules</c> before evaluation.
/// </remarks>
public interface IAlertRuleRepository
{
    /// <summary>Inserts a new rule row.</summary>
    Task CreateAsync(AlertRule rule, CancellationToken ct);

    /// <summary>Updates mutable rule fields; the row must belong to the rule's tenant/workspace/project.</summary>
    Task UpdateAsync(AlertRule rule, CancellationToken ct);

    /// <summary>Loads a single rule by id within <paramref name="scope" />; <c>null</c> when missing or out of scope.</summary>
    Task<AlertRule?> GetByIdAsync(ScopeContext scope, Guid ruleId, CancellationToken ct);

    /// <summary>All rules in scope (enabled and disabled).</summary>
    Task<IReadOnlyList<AlertRule>> ListByScopeAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken ct);

    /// <summary>Rules eligible for evaluation (<see cref="AlertRule.IsEnabled" /> and scope match).</summary>
    Task<IReadOnlyList<AlertRule>> ListEnabledByScopeAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken ct);
}
