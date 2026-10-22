using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Core.Persistence.Ports;

public interface IArchitectureVersionRepository
{
    Task<ArchitectureVersionRecord?> GetByContentHashAsync(
        ScopeContext scope,
        Guid architectureId,
        byte[] contentHashSha256,
        CancellationToken cancellationToken = default);

    Task<int> GetLatestVersionNumberAsync(
        ScopeContext scope,
        Guid architectureId,
        CancellationToken cancellationToken = default);

    Task<ArchitectureVersionRecord> CreateAsync(
        ScopeContext scope,
        ArchitectureVersionRecord record,
        CancellationToken cancellationToken = default);

    public Task<ArchitectureVersionRecord?> GetByIdAsync(
        ScopeContext scope,
        Guid architectureVersionId,
        CancellationToken cancellationToken = default);

    Task<ArchitectureVersionRecord?> GetByArchitectureIdAndVersionNumberAsync(
        ScopeContext scope,
        Guid architectureId,
        int versionNumber,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<ArchitectureVersionRecord>> ListByArchitectureIdAsync(
        ScopeContext scope,
        Guid architectureId,
        CancellationToken cancellationToken = default);
}
