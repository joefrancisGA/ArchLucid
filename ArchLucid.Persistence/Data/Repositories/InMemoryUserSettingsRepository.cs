using System.Collections.Concurrent;

namespace ArchLucid.Persistence.Data.Repositories;

/// <summary>In-memory user settings for JWT integration tests without SQL.</summary>
public sealed class InMemoryUserSettingsRepository : IUserSettingsRepository
{
    private readonly ConcurrentDictionary<(string UserId, string Key), string> _values = new();

    /// <inheritdoc />
    public Task<string?> TryGetAsync(string userId, string preferenceKey, CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(userId);
        ArgumentException.ThrowIfNullOrWhiteSpace(preferenceKey);

        cancellationToken.ThrowIfCancellationRequested();

        _values.TryGetValue((userId.Trim(), preferenceKey.Trim()), out string? value);

        return Task.FromResult<string?>(value);
    }

    /// <inheritdoc />
    public Task UpsertAsync(
        string userId,
        string preferenceKey,
        string preferenceValue,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(userId);
        ArgumentException.ThrowIfNullOrWhiteSpace(preferenceKey);
        ArgumentException.ThrowIfNullOrWhiteSpace(preferenceValue);

        cancellationToken.ThrowIfCancellationRequested();

        _values[(userId.Trim(), preferenceKey.Trim())] = preferenceValue.Trim();

        return Task.CompletedTask;
    }
}
