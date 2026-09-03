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

        EmailOtpChallengeRecord row = EmailOtpChallengeRepositoryCore.CreateFromInsert(
            insert,
            TimeProvider.System.GetUtcNow());

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
            EmailOtpChallengeRepositoryCore.MatchesRecentRequestByEmail(row, normalizedEmail, sinceUtc));

        return Task.FromResult(count);
    }

    public Task<int> CountRecentRequestsByClientIpHashAsync(
        string clientIpHash,
        DateTimeOffset sinceUtc,
        CancellationToken cancellationToken)
    {
        _ = cancellationToken;

        int count = _byId.Values.Count(row =>
            EmailOtpChallengeRepositoryCore.MatchesRecentRequestByClientIp(row, clientIpHash, sinceUtc));

        return Task.FromResult(count);
    }

    public Task<EmailOtpRecentRequestCounts> CountRecentRequestsForRateLimitAsync(
        string normalizedEmail,
        string? clientIpHash,
        DateTimeOffset sinceUtc,
        CancellationToken cancellationToken)
    {
        _ = cancellationToken;

        return Task.FromResult(
            EmailOtpChallengeRepositoryCore.CountRecentRequests(_byId.Values, normalizedEmail, clientIpHash, sinceUtc));
    }

    public Task<int> CountRecentFailedVerificationsByEmailAsync(
        string normalizedEmail,
        DateTimeOffset sinceUtc,
        CancellationToken cancellationToken)
    {
        _ = cancellationToken;

        int count = _byId.Values.Count(row =>
            EmailOtpChallengeRepositoryCore.MatchesFailedVerificationByEmail(row, normalizedEmail, sinceUtc));

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

            if (row.NormalizedEmail != normalizedEmail || !EmailOtpChallengeRepositoryCore.IsActive(row))
                continue;

            _byId[entry.Key] = EmailOtpChallengeRepositoryCore.Clone(row, invalidatedUtc: invalidatedUtc);
        }

        return Task.CompletedTask;
    }

    public Task<EmailOtpChallengeRecord> ReplaceActiveChallengeForEmailAsync(
        EmailOtpChallengeInsert insert,
        DateTimeOffset invalidatedUtc,
        CancellationToken cancellationToken)
    {
        _ = cancellationToken;
        ArgumentNullException.ThrowIfNull(insert);

        lock (_completionLock)
        {
            List<Guid> activeIds = [];

            foreach (KeyValuePair<Guid, EmailOtpChallengeRecord> entry in _byId)
            {
                EmailOtpChallengeRecord row = entry.Value;

                if (row.NormalizedEmail == insert.NormalizedEmail && EmailOtpChallengeRepositoryCore.IsActive(row))
                    activeIds.Add(entry.Key);
            }

            foreach (Guid id in activeIds)
            {
                EmailOtpChallengeRecord row = _byId[id];
                _byId[id] = EmailOtpChallengeRepositoryCore.Clone(row, invalidatedUtc: invalidatedUtc);
            }

            EmailOtpChallengeRecord created = EmailOtpChallengeRepositoryCore.CreateFromInsert(
                insert,
                TimeProvider.System.GetUtcNow());

            _byId[created.Id] = created;

            return Task.FromResult(created);
        }
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
                    Result = EmailOtpChallengeCompletionResult.NotFound,
                });
            }

            (EmailOtpChallengeCompletionOutcome outcome, EmailOtpChallengeRecord? updated) =
                EmailOtpChallengeRepositoryCore.EvaluateCompletion(existing, codeHash, nowUtc, maxFailedAttempts);

            if (updated is not null)
                _byId[challengeId] = updated;

            return Task.FromResult(outcome);
        }
    }
}
