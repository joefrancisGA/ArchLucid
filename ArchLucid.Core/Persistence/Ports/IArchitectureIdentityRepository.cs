using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Pagination;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Core.Persistence.Ports;

public interface IArchitectureIdentityRepository
{
    Task<ArchitectureIdentityRecord> CreateAsync(
        ScopeContext scope,
        string displayName,
        string? currentModelId,
        CancellationToken cancellationToken = default);

    Task<ArchitectureIdentityRecord?> GetByIdAsync(
        ScopeContext scope,
        Guid architectureId,
        CancellationToken cancellationToken = default);

    Task UpdateCurrentModelAsync(
        ScopeContext scope,
        Guid architectureId,
        string currentModelId,
        CancellationToken cancellationToken = default);

    Task UpdateLatestSealedManifestAsync(
        ScopeContext scope,
        Guid architectureId,
        Guid manifestId,
        CancellationToken cancellationToken = default);

    Task<PagedResponse<ArchitectureIdentityListItem>> ListAsync(
        ScopeContext scope,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default);

    Task<ArchitectureIdentityDetail?> GetDetailAsync(
        ScopeContext scope,
        Guid architectureId,
        CancellationToken cancellationToken = default);
}
