using ArchLucid.Contracts.Operator;

namespace ArchLucid.Persistence.Data.Repositories;

/// <summary>Reads and writes <c>dbo.OperatorSavedViews</c> for tenant- and user-scoped operator UI presets.</summary>
public interface IOperatorSavedViewRepository
{
    /// <summary>Lists saved views for the tenant/user pair, optionally filtered by <paramref name="surface" />.</summary>
    Task<IReadOnlyList<OperatorSavedViewResponse>> ListAsync(
        Guid tenantId,
        string userId,
        string? surface,
        CancellationToken cancellationToken);

    /// <summary>
    ///     Inserts a saved view. Returns null when <paramref name="tenantId" /> is unknown to <c>dbo.Tenants</c>.
    ///     Throws <see cref="InvalidOperationException" /> when the name already exists for the same surface.
    /// </summary>
    Task<OperatorSavedViewResponse?> CreateAsync(
        Guid tenantId,
        string userId,
        string surface,
        string name,
        string payloadJson,
        string? sortKey,
        bool isShared,
        CancellationToken cancellationToken);

    /// <summary>Deletes a view owned by the tenant/user pair. Returns false when no row matched.</summary>
    Task<bool> DeleteAsync(
        Guid tenantId,
        string userId,
        Guid viewId,
        CancellationToken cancellationToken);
}
