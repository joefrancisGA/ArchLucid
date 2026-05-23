using System.Data;

using ArchLucid.Contracts.Governance;

namespace ArchLucid.Core.Persistence.Ports;

/// <summary>Append-only persistence for <see cref="PolicyPackChangeLogEntry" />.</summary>
public interface IPolicyPackChangeLogRepository
{
    Task AppendAsync(
        PolicyPackChangeLogEntry entry,
        CancellationToken cancellationToken = default,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null);

    Task<IReadOnlyList<PolicyPackChangeLogEntry>> GetByPolicyPackIdAsync(
        Guid policyPackId,
        int maxRows = 50,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<PolicyPackChangeLogEntry>> GetByTenantAsync(
        Guid tenantId,
        int maxRows = 100,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<PolicyPackChangeLogEntry>> GetByTenantInRangeAsync(
        Guid tenantId,
        DateTime fromUtc,
        DateTime toUtc,
        CancellationToken cancellationToken = default);
}
