using ArchLucid.Core.Identity;

namespace ArchLucid.Application.Tests.Identity;

/// <summary>
///     Thread-safe in-memory <see cref="ITrialIdentityUserRepository" /> for concurrency regression tests.
/// </summary>
internal sealed class ConcurrentTrialIdentityUserRepository : ITrialIdentityUserRepository
{
    private readonly object _sync = new();
    private TrialIdentityUserRecord? _user;

    public void Seed(TrialIdentityUserRecord user)
    {
        ArgumentNullException.ThrowIfNull(user);

        lock (_sync)
        {
            _user = user;
        }
    }

    public Task<TrialIdentityUserRecord?> GetByNormalizedEmailAsync(
        string normalizedEmail,
        CancellationToken cancellationToken)
    {
        _ = cancellationToken;

        lock (_sync)
        {
            if (_user is null || !string.Equals(_user.NormalizedEmail, normalizedEmail, StringComparison.Ordinal))
            {
                return Task.FromResult<TrialIdentityUserRecord?>(null);
            }

            return Task.FromResult<TrialIdentityUserRecord?>(Clone(_user));
        }
    }

    public Task RecordAccessFailedAsync(
        string normalizedEmail,
        int maxAttemptsBeforeLockout,
        DateTimeOffset lockoutEndUtcIfThresholdReached,
        CancellationToken cancellationToken)
    {
        _ = cancellationToken;

        lock (_sync)
        {
            if (_user is null || !string.Equals(_user.NormalizedEmail, normalizedEmail, StringComparison.Ordinal))
            {
                return Task.CompletedTask;
            }

            int newCount = _user.AccessFailedCount + 1;
            DateTimeOffset? lockoutEnd = newCount >= maxAttemptsBeforeLockout
                ? lockoutEndUtcIfThresholdReached
                : _user.LockoutEnd;

            _user = Clone(_user, newCount, lockoutEnd);
        }

        return Task.CompletedTask;
    }

    public Task ResetAccessFailedAsync(string normalizedEmail, CancellationToken cancellationToken)
    {
        _ = cancellationToken;

        lock (_sync)
        {
            if (_user is null || !string.Equals(_user.NormalizedEmail, normalizedEmail, StringComparison.Ordinal))
            {
                return Task.CompletedTask;
            }

            _user = Clone(_user, accessFailedCount: 0, lockoutEnd: null);
        }

        return Task.CompletedTask;
    }

    public Task<Guid> CreatePendingUserAsync(
        string normalizedEmail,
        string email,
        string passwordHash,
        string securityStamp,
        string concurrencyStamp,
        string emailConfirmationTokenHash,
        DateTimeOffset emailConfirmationExpiresUtc,
        CancellationToken cancellationToken)
    {
        throw new NotSupportedException();
    }

    public Task<bool> TryConfirmEmailAsync(
        string normalizedEmail,
        string emailConfirmationTokenHash,
        DateTimeOffset nowUtc,
        CancellationToken cancellationToken)
    {
        throw new NotSupportedException();
    }

    public Task<bool> TryLinkLocalIdentityToEntraAsync(
        string normalizedEmail,
        string entraOid,
        CancellationToken cancellationToken)
    {
        throw new NotSupportedException();
    }

    public int GetAccessFailedCount()
    {
        lock (_sync)
        {
            return _user?.AccessFailedCount ?? 0;
        }
    }

    private static TrialIdentityUserRecord Clone(
        TrialIdentityUserRecord source,
        int? accessFailedCount = null,
        DateTimeOffset? lockoutEnd = null)
    {
        return new TrialIdentityUserRecord
        {
            Id = source.Id,
            NormalizedEmail = source.NormalizedEmail,
            Email = source.Email,
            PasswordHash = source.PasswordHash,
            SecurityStamp = source.SecurityStamp,
            ConcurrencyStamp = source.ConcurrencyStamp,
            EmailConfirmed = source.EmailConfirmed,
            EmailVerifiedUtc = source.EmailVerifiedUtc,
            LockoutEnd = lockoutEnd ?? source.LockoutEnd,
            LockoutEnabled = source.LockoutEnabled,
            AccessFailedCount = accessFailedCount ?? source.AccessFailedCount,
            EmailConfirmationTokenHash = source.EmailConfirmationTokenHash,
            EmailConfirmationExpiresUtc = source.EmailConfirmationExpiresUtc,
            LinkedEntraOid = source.LinkedEntraOid,
            LinkedUtc = source.LinkedUtc
        };
    }
}
