using System.Collections.Concurrent;

using ArchLucid.Contracts.Operator;

namespace ArchLucid.Persistence.Data.Repositories;

/// <summary>In-memory saved views for JWT integration tests without SQL.</summary>
public sealed class InMemoryOperatorSavedViewRepository : IOperatorSavedViewRepository
{
    private readonly ConcurrentDictionary<Guid, OperatorSavedViewStoredRow> _views = new();

    /// <inheritdoc />
    public Task<IReadOnlyList<OperatorSavedViewResponse>> ListAsync(
        Guid tenantId,
        string userId,
        string? surface,
        CancellationToken cancellationToken)
    {
        IEnumerable<OperatorSavedViewStoredRow> query = _views.Values.Where(view =>
            OperatorSavedViewRepositoryCore.IsVisibleToUser(
                tenantId,
                userId,
                view.UserId,
                view.TenantId,
                view.IsShared)
            && OperatorSavedViewRepositoryCore.MatchesSurface(view.Surface, surface));

        IReadOnlyList<OperatorSavedViewResponse> rows = OperatorSavedViewRepositoryCore
            .OrderByName(query)
            .Select(view => OperatorSavedViewRepositoryCore.MapToResponse(view, userId))
            .ToList();

        return Task.FromResult(rows);
    }

    /// <inheritdoc />
    public Task<OperatorSavedViewResponse?> CreateAsync(
        Guid tenantId,
        string userId,
        string surface,
        string name,
        string payloadJson,
        string? sortKey,
        bool isShared,
        CancellationToken cancellationToken)
    {
        if (OperatorSavedViewRepositoryCore.IsDuplicateName(_views.Values, tenantId, userId, surface, name))
        {
            throw OperatorSavedViewRepositoryCore.CreateDuplicateNameException(name, surface);
        }

        DateTimeOffset now = TimeProvider.System.GetUtcNow();
        OperatorSavedViewStoredRow stored = new()
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            UserId = userId,
            Surface = surface,
            Name = name,
            SortKey = sortKey,
            PayloadJson = payloadJson,
            IsShared = isShared,
            CreatedUtc = now,
            UpdatedUtc = now,
        };

        _views[stored.Id] = stored;

        return Task.FromResult<OperatorSavedViewResponse?>(
            OperatorSavedViewRepositoryCore.MapToResponse(stored, userId));
    }

    /// <inheritdoc />
    public Task<bool> DeleteAsync(
        Guid tenantId,
        string userId,
        Guid viewId,
        CancellationToken cancellationToken)
    {
        if (!_views.TryGetValue(viewId, out OperatorSavedViewStoredRow? stored))
            return Task.FromResult(false);

        if (stored.TenantId != tenantId || !string.Equals(stored.UserId, userId, StringComparison.Ordinal))
            return Task.FromResult(false);

        return Task.FromResult(_views.TryRemove(viewId, out _));
    }
}
