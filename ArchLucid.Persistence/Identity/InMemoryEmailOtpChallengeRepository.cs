using System.Collections.Concurrent;

using ArchLucid.Core.Identity;

namespace ArchLucid.Persistence.Identity;

public sealed class InMemoryEmailOtpChallengeRepository : IEmailOtpChallengeRepository
{
    private readonly ConcurrentDictionary<Guid, EmailOtpChallengeRecord> _byId = new();

    private readonly object _completionLock = new();

    public Task<EmailOtpChallengeRecord> InsertAsync(EmailOtpChallengeInsert insert, CancellationToken cancellationToken)
    {
        _ = cancellationToken;
        ArgumentNullException.ThrowIfNull(insert);

        DateTimeOffset now = TimeProvider.System.GetUtcNow();
        EmailOtpChallengeRecord row = new()
        {
            Id = insert.Id != Guid.Empty ? insert.Id : Guid.NewGuid(),
            NormalizedEmail = insert.NormalizedEmail,
            CodeHash = insert.CodeHash,
            CreatedUtc = now,
            ExpiresUtc = insert.ExpiresUtc,
            FailedAttemptCount = 0,
            ClientIpHash = insert.ClientIpHash,
            UserAgentHash = insert.UserAgentHash,
            InvitationId = insert.InvitationId
        };

        _byId[row.Id] = row;

        return Task.FromResult(row);
    }

    public Task<EmailOtpChallengeRecord?> GetByIdAsync(Guid challengeId, CancellationToken cancellationToken)
    {
        _ = cancellationToken;

        _byId.TryGetValue(challengeId, out EmailOtpChallengeRecord? row);

        return Task.FromResult(row);
    }

    public Task<int> CountRecentRequestsByEmailAsync(
        string normalizedEmail,
        DateTimeOffset sinceUtc,
        CancellationToken cancellationToken)
    {
        _ = cancellationToken;

        int count = _byId.Values.Count(row =>
            row.NormalizedEmail == normalizedEmail && row.CreatedUtc >= sinceUtc);

        return Task.FromResult(count);
    }

    public Task<int> CountRecentRequestsByClientIpHashAsync(
        string clientIpHash,
        DateTimeOffset sinceUtc,
        CancellationToken cancellationToken)
    {
        _ = cancellationToken;

        int count = _byId.Values.Count(row =>
            row.ClientIpHash == clientIpHash && row.CreatedUtc >= sinceUtc);

        return Task.FromResult(count);
    }

    public Task<EmailOtpRecentRequestCounts> CountRecentRequestsForRateLimitAsync(
        string normalizedEmail,
        string? clientIpHash,
        DateTimeOffset sinceUtc,
        CancellationToken cancellationToken)
    {
        _ = cancellationToken;

        int emailCount = _byId.Values.Count(row =>
            row.NormalizedEmail == normalizedEmail && row.CreatedUtc >= sinceUtc);

        int ipCount = clientIpHash is null
            ? 0
            : _byId.Values.Count(row =>
                row.ClientIpHash == clientIpHash && row.CreatedUtc >= sinceUtc);

        return Task.FromResult(new EmailOtpRecentRequestCounts(emailCount, ipCount));
    }

    public Task<int> CountRecentFailedVerificationsByEmailAsync(
        string normalizedEmail,
        DateTimeOffset sinceUtc,
        CancellationToken cancellationToken)
    {
        _ = cancellationToken;

        int count = _byId.Values.Count(row =>
            row.NormalizedEmail == normalizedEmail
            && row.FailedAttemptCount > 0
            && row.CreatedUtc >= sinceUtc
            && row.CompletedUtc is null);

        return Task.FromResult(count);
    }

    public Task<DateTimeOffset?> GetLatestRequestUtcByEmailAsync(
        string normalizedEmail,
        CancellationToken cancellationToken)
    {
        _ = cancellationToken;

        DateTimeOffset? latest = _byId.Values
            .Where(row => row.NormalizedEmail == normalizedEmail)
            .Select(row => (DateTimeOffset?)row.CreatedUtc)
            .OrderByDescending(row => row)
            .FirstOrDefault();

        return Task.FromResult(latest);
    }

    public Task InvalidateActiveChallengesForEmailAsync(
        string normalizedEmail,
        DateTimeOffset invalidatedUtc,
        CancellationToken cancellationToken)
    {
        _ = cancellationToken;

        foreach (KeyValuePair<Guid, EmailOtpChallengeRecord> entry in _byId)
        {
            EmailOtpChallengeRecord row = entry.Value;

            if (row.NormalizedEmail != normalizedEmail || row.CompletedUtc is not null || row.InvalidatedUtc is not null)
            {
                continue;
            }

            _byId[entry.Key] = Clone(row, invalidatedUtc: invalidatedUtc);
        }

        return Task.CompletedTask;
    }

    public Task<EmailOtpChallengeCompletionOutcome> TryCompleteAsync(
        Guid challengeId,
        string codeHash,
        DateTimeOffset nowUtc,
        int maxFailedAttempts,
        CancellationToken cancellationToken)
    {
        _ = cancellationToken;

        lock (_completionLock)
        {
            if (!_byId.TryGetValue(challengeId, out EmailOtpChallengeRecord? existing))
            {
                return Task.FromResult(new EmailOtpChallengeCompletionOutcome
                {
                    Result = EmailOtpChallengeCompletionResult.NotFound
                });
            }

            if (existing.CompletedUtc is not null)
            {
                return Task.FromResult(new EmailOtpChallengeCompletionOutcome
                {
                    Result = EmailOtpChallengeCompletionResult.AlreadyCompleted
                });
            }

            if (existing.InvalidatedUtc is not null)
            {
                return Task.FromResult(new EmailOtpChallengeCompletionOutcome
                {
                    Result = EmailOtpChallengeCompletionResult.Invalidated
                });
            }

            if (existing.ExpiresUtc <= nowUtc)
            {
                return Task.FromResult(new EmailOtpChallengeCompletionOutcome
                {
                    Result = EmailOtpChallengeCompletionResult.Expired
                });
            }

            if (!FixedTimeHexEquals.Equals(existing.CodeHash, codeHash))
            {
                int failed = existing.FailedAttemptCount + 1;
                DateTimeOffset? invalidatedUtc = failed >= maxFailedAttempts ? nowUtc : null;

                EmailOtpChallengeRecord updated = Clone(
                    existing,
                    failedAttemptCount: failed,
                    invalidatedUtc: invalidatedUtc);

                _byId[challengeId] = updated;

                return Task.FromResult(new EmailOtpChallengeCompletionOutcome
                {
                    Result = failed >= maxFailedAttempts
                        ? EmailOtpChallengeCompletionResult.TooManyAttempts
                        : EmailOtpChallengeCompletionResult.InvalidCode
                });
            }

            EmailOtpChallengeRecord completed = Clone(existing, completedUtc: nowUtc);
            _byId[challengeId] = completed;

            return Task.FromResult(new EmailOtpChallengeCompletionOutcome
            {
                Result = EmailOtpChallengeCompletionResult.Completed,
                Challenge = completed
            });
        }
    }

    private static EmailOtpChallengeRecord Clone(
        EmailOtpChallengeRecord existing,
        int? failedAttemptCount = null,
        DateTimeOffset? completedUtc = null,
        DateTimeOffset? invalidatedUtc = null) =>
        new()
        {
            Id = existing.Id,
            NormalizedEmail = existing.NormalizedEmail,
            CodeHash = existing.CodeHash,
            CreatedUtc = existing.CreatedUtc,
            ExpiresUtc = existing.ExpiresUtc,
            FailedAttemptCount = failedAttemptCount ?? existing.FailedAttemptCount,
            CompletedUtc = completedUtc ?? existing.CompletedUtc,
            InvalidatedUtc = invalidatedUtc ?? existing.InvalidatedUtc,
            ClientIpHash = existing.ClientIpHash,
            UserAgentHash = existing.UserAgentHash,
            InvitationId = existing.InvitationId,
            RowVersion = existing.RowVersion
        };
}
