using System.Data;

using ArchLucid.Contracts.Governance.PolicyPacks;

namespace ArchLucid.Core.Persistence.Ports;

/// <summary>Persistence port for <see cref="PolicyPack" /> aggregate metadata (not version rows).</summary>
public interface IPolicyPackRepository
{
    Task CreateAsync(
        PolicyPack pack,
        CancellationToken ct,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null);

    Task UpdateAsync(PolicyPack pack, CancellationToken ct);

    Task<PolicyPack?> GetByIdAsync(Guid policyPackId, CancellationToken ct);

    Task<IReadOnlyList<PolicyPack>> ListByScopeAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken ct);
}
