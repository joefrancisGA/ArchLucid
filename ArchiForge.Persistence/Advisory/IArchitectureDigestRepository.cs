using ArchiForge.Decisioning.Advisory.Scheduling;

namespace ArchiForge.Persistence.Advisory;

public interface IArchitectureDigestRepository
{
    Task CreateAsync(ArchitectureDigest digest, CancellationToken ct);

    Task<IReadOnlyList<ArchitectureDigest>> ListByScopeAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        int take,
        CancellationToken ct);

    Task<ArchitectureDigest?> GetByIdAsync(Guid digestId, CancellationToken ct);
}
