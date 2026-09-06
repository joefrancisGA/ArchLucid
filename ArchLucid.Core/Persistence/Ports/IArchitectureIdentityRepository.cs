using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Core.Persistence.Ports;

public interface IArchitectureIdentityRepository
{
    Task<ArchitectureIdentityRecord> CreateAsync(
        ScopeContext scope,
        ArchitectureIdentityCreateArgs createArgs,
        CancellationToken cancellationToken = default);

    Task<ArchitectureIdentityRecord?> GetByIdAsync(
        ScopeContext scope,
        Guid architectureId,
        CancellationToken cancellationToken = default);

    Task<ArchitectureIdentityListResult> ListAsync(
        ScopeContext scope,
        int skip,
        int take,
        CancellationToken cancellationToken = default);

    Task<ArchitectureIdentityWithChildren?> GetWithChildrenAsync(
        ScopeContext scope,
        Guid architectureId,
        CancellationToken cancellationToken = default);

    Task<ArchitectureIdentityRecord?> UpdateDisplayNameAsync(
        ScopeContext scope,
        Guid architectureId,
        string displayName,
        string? description,
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
}
