using System.Collections.Concurrent;
using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Operator;

namespace ArchLucid.Persistence.Data.Repositories;

/// <summary>In-memory saved views for JWT integration tests without SQL.</summary>
public sealed class InMemoryOperatorSavedViewRepository : IOperatorSavedViewRepository
{
    private readonly ConcurrentDictionary<Guid, StoredView> _views = new();

    /// <inheritdoc />
    public Task<IReadOnlyList<OperatorSavedViewResponse>> ListAsync(
        Guid tenantId,
        string userId,
        string? surface,
        CancellationToken cancellationToken)
    {
        IEnumerable<StoredView> query = _views.Values.Where(view =>
            view.TenantId == tenantId
            && (string.Equals(view.UserId, userId, StringComparison.Ordinal) || view.IsShared));

        if (!string.IsNullOrWhiteSpace(surface))
        {
            query = query.Where(view => string.Equals(view.Surface, surface, StringComparison.OrdinalIgnoreCase));
        }

        IReadOnlyList<OperatorSavedViewResponse> rows = query
            .OrderBy(view => view.Name, StringComparer.Ordinal)
            .Select(view => MapStored(view, userId))
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
        bool duplicate = _views.Values.Any(view =>
            view.TenantId == tenantId
            && string.Equals(view.UserId, userId, StringComparison.Ordinal)
            && string.Equals(view.Surface, surface, StringComparison.OrdinalIgnoreCase)
            && string.Equals(view.Name, name, StringComparison.Ordinal));

        if (duplicate)
        {
            throw new InvalidOperationException(
                $"A saved view named '{name}' already exists for surface '{surface}'.");
        }

        DateTimeOffset now = TimeProvider.System.GetUtcNow();
        StoredView stored = new()
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
            UpdatedUtc = now
        };

        _views[stored.Id] = stored;

        return Task.FromResult<OperatorSavedViewResponse?>(MapStored(stored, userId));
    }

    /// <inheritdoc />
    public Task<bool> DeleteAsync(
        Guid tenantId,
        string userId,
        Guid viewId,
        CancellationToken cancellationToken)
    {
        if (!_views.TryGetValue(viewId, out StoredView? stored))
        {
            return Task.FromResult(false);
        }

        if (stored.TenantId != tenantId || !string.Equals(stored.UserId, userId, StringComparison.Ordinal))
        {
            return Task.FromResult(false);
        }

        return Task.FromResult(_views.TryRemove(viewId, out _));
    }

    private static OperatorSavedViewResponse MapStored(StoredView stored, string currentUserId)
    {
        OperatorSavedViewPayload payload =
            JsonSerializer.Deserialize<OperatorSavedViewPayload>(stored.PayloadJson, ContractJson.CamelCaseDeserializeCaseInsensitive)
            ?? new OperatorSavedViewPayload();

        return new OperatorSavedViewResponse
        {
            Id = stored.Id,
            Surface = stored.Surface,
            Name = stored.Name,
            Payload = payload,
            CreatedUtc = stored.CreatedUtc,
            UpdatedUtc = stored.UpdatedUtc,
            IsShared = stored.IsShared,
            IsOwnedByCurrentUser = string.Equals(stored.UserId, currentUserId, StringComparison.Ordinal)
        };
    }

    private sealed class StoredView
    {
        public Guid Id
        {
            get;
            init;
        }

        public Guid TenantId
        {
            get;
            init;
        }

        public string UserId
        {
            get;
            init;
        } = string.Empty;

        public string Surface
        {
            get;
            init;
        } = string.Empty;

        public string Name
        {
            get;
            init;
        } = string.Empty;

        public string? SortKey
        {
            get;
            init;
        }

        public bool IsShared
        {
            get;
            init;
        }

        public string PayloadJson
        {
            get;
            init;
        } = string.Empty;

        public DateTimeOffset CreatedUtc
        {
            get;
            init;
        }

        public DateTimeOffset UpdatedUtc
        {
            get;
            init;
        }
    }
}
