using ArchLucid.Contracts.Governance.Posture;

namespace ArchLucid.Persistence.Governance.Posture;

/// <summary>Tenant-scoped aggregate read for architecture posture (TB-2375).</summary>
public interface IArchitecturePostureReader
{
    Task<ArchitecturePostureReadModel> ReadAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken cancellationToken = default);
}
