using ArchLucid.Core.Scoping;

namespace ArchLucid.Core.Persistence.ApplicationPorts.Architecture;

public interface IArchitectureShareRepository
{
    Task<int> CountSharesAsync(
        ScopeContext scope,
        Guid architectureId,
        CancellationToken cancellationToken = default);

    Task<bool?> TryGetRestrictToSharesAsync(
        ScopeContext scope,
        Guid architectureId,
        CancellationToken cancellationToken = default);

    Task<bool> TryEnableRestrictToSharesAsync(
        ScopeContext scope,
        Guid architectureId,
        Guid actorUserId,
        string grantedBy,
        CancellationToken cancellationToken = default);

    Task<bool> TryDisableRestrictToSharesAsync(
        ScopeContext scope,
        Guid architectureId,
        CancellationToken cancellationToken = default);

    Task<string?> TryGetShareRoleAsync(
        ScopeContext scope,
        Guid architectureId,
        Guid userId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<ArchitectureShareRecord>> ListSharesAsync(
        ScopeContext scope,
        Guid architectureId,
        CancellationToken cancellationToken = default);

    Task<bool> UpsertShareAsync(
        ScopeContext scope,
        Guid architectureId,
        Guid userId,
        string role,
        string grantedBy,
        CancellationToken cancellationToken = default);

    Task<bool> TryDeleteShareAsync(
        ScopeContext scope,
        Guid architectureId,
        Guid userId,
        CancellationToken cancellationToken = default);
}
