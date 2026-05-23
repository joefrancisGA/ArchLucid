using ArchLucid.Contracts.Advisory.Scheduling;

namespace ArchLucid.Core.Persistence.Ports;

/// <summary>Persistence for <see cref="ArchitectureDigest" /> rows.</summary>
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

    Task<int> ArchiveDigestsGeneratedBeforeAsync(DateTimeOffset cutoffUtc, CancellationToken ct);
}
