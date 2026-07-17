using System.Collections.Concurrent;

using ArchLucid.Core.Identity;

namespace ArchLucid.Persistence.Identity;

public sealed class InMemoryPlatformUserRepository : IPlatformUserRepository
{
    private readonly ConcurrentDictionary<Guid, PlatformUserRecord> _byId = new();

    public Task<PlatformUserRecord?> GetByIdAsync(Guid userId, CancellationToken cancellationToken)
    {
        _ = cancellationToken;

        _byId.TryGetValue(userId, out PlatformUserRecord? row);

        return Task.FromResult(row);
    }

    public Task<PlatformUserRecord> InsertAsync(PlatformUserInsert insert, CancellationToken cancellationToken)
    {
        _ = cancellationToken;
        ArgumentNullException.ThrowIfNull(insert);

        DateTimeOffset now = TimeProvider.System.GetUtcNow();
        PlatformUserRecord row = new()
        {
            Id = insert.Id != Guid.Empty ? insert.Id : Guid.NewGuid(),
            PrimaryEmail = insert.PrimaryEmail,
            NormalizedPrimaryEmail = insert.NormalizedPrimaryEmail,
            DisplayName = insert.DisplayName,
            Status = insert.Status,
            CreatedUtc = now,
            UpdatedUtc = now,
            AuthVersion = insert.AuthVersion != Guid.Empty ? insert.AuthVersion : Guid.NewGuid()
        };

        _byId[row.Id] = row;

        return Task.FromResult(row);
    }

    public Task UpdateStatusAsync(
        Guid userId,
        PlatformUserStatus status,
        DateTimeOffset updatedUtc,
        CancellationToken cancellationToken)
    {
        _ = cancellationToken;

        if (!_byId.TryGetValue(userId, out PlatformUserRecord? existing))
        {
            throw new PlatformUserNotFoundException(userId);
        }

        PlatformUserRecord updated = new()
        {
            Id = existing.Id,
            PrimaryEmail = existing.PrimaryEmail,
            NormalizedPrimaryEmail = existing.NormalizedPrimaryEmail,
            DisplayName = existing.DisplayName,
            Status = status,
            CreatedUtc = existing.CreatedUtc,
            UpdatedUtc = updatedUtc,
            AuthVersion = existing.AuthVersion
        };

        _byId[userId] = updated;

        return Task.CompletedTask;
    }

    public Task UpdatePrimaryEmailAsync(
        Guid userId,
        string primaryEmail,
        string normalizedPrimaryEmail,
        DateTimeOffset updatedUtc,
        CancellationToken cancellationToken)
    {
        _ = cancellationToken;

        if (!_byId.TryGetValue(userId, out PlatformUserRecord? existing))
        {
            throw new PlatformUserNotFoundException(userId);
        }

        PlatformUserRecord updated = new()
        {
            Id = existing.Id,
            PrimaryEmail = primaryEmail,
            NormalizedPrimaryEmail = normalizedPrimaryEmail,
            DisplayName = existing.DisplayName,
            Status = existing.Status,
            CreatedUtc = existing.CreatedUtc,
            UpdatedUtc = updatedUtc,
            AuthVersion = existing.AuthVersion
        };

        _byId[userId] = updated;

        return Task.CompletedTask;
    }

    public Task RotateAuthVersionAsync(
        Guid userId,
        Guid authVersion,
        DateTimeOffset updatedUtc,
        CancellationToken cancellationToken)
    {
        _ = cancellationToken;

        if (!_byId.TryGetValue(userId, out PlatformUserRecord? existing))
        {
            throw new PlatformUserNotFoundException(userId);
        }

        PlatformUserRecord updated = new()
        {
            Id = existing.Id,
            PrimaryEmail = existing.PrimaryEmail,
            NormalizedPrimaryEmail = existing.NormalizedPrimaryEmail,
            DisplayName = existing.DisplayName,
            Status = existing.Status,
            CreatedUtc = existing.CreatedUtc,
            UpdatedUtc = updatedUtc,
            AuthVersion = authVersion
        };

        _byId[userId] = updated;

        return Task.CompletedTask;
    }
}
