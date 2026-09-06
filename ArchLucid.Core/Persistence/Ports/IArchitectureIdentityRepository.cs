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

    /// <summary>
    ///     Updates <see cref="ArchitectureIdentityRecord.DisplayName" /> only when it is still the DA-02 untitled default.
    /// </summary>
    Task<bool> TryUpdateDisplayNameWhenUntitledAsync(
        ScopeContext scope,
        Guid architectureId,
        string displayName,
        CancellationToken cancellationToken = default);

    /// <summary>
    ///     Patches <see cref="ArchitectureIdentityRecord.DisplayName" /> and/or
    ///     <see cref="ArchitectureIdentityRecord.Description" /> when the identity exists in scope.
    /// </summary>
    Task<bool> TryPatchAsync(
        ScopeContext scope,
        Guid architectureId,
        bool updateDisplayName,
        string? displayName,
        bool updateDescription,
        string? description,
        CancellationToken cancellationToken = default);

    /// <summary>Soft-archives or restores an architecture identity without touching child rows (CA-49).</summary>
    Task<bool> TrySetArchivedAsync(
        ScopeContext scope,
        Guid architectureId,
        bool archived,
        CancellationToken cancellationToken = default);

    Task<int> CountArchivedInScopeAsync(
        ScopeContext scope,
        CancellationToken cancellationToken = default);

    Task<ArchitectureIdentityListPage> ListAsync(
        ScopeContext scope,
        int page,
        int pageSize,
        bool includeArchived = false,
        CancellationToken cancellationToken = default);

    Task<ArchitectureIdentityDetail?> GetDetailAsync(
        ScopeContext scope,
        Guid architectureId,
        CancellationToken cancellationToken = default);
}
