using ArchLucid.Core.Identity;

namespace ArchLucid.Persistence.Identity;

/// <summary>
///     Shared email OTP challenge mapping, rate-limit predicates, and completion lifecycle for SQL and in-memory stores.
/// </summary>
internal static class EmailOtpChallengeRepositoryCore
{
    public static EmailOtpChallengeRecord CreateFromInsert(EmailOtpChallengeInsert insert, DateTimeOffset nowUtc)
    {
        ArgumentNullException.ThrowIfNull(insert);

        return new EmailOtpChallengeRecord
        {
            Id = insert.Id != Guid.Empty ? insert.Id : Guid.NewGuid(),
            NormalizedEmail = insert.NormalizedEmail,
            CodeHash = insert.CodeHash,
            CreatedUtc = nowUtc,
            ExpiresUtc = insert.ExpiresUtc,
            FailedAttemptCount = 0,
            ClientIpHash = insert.ClientIpHash,
            UserAgentHash = insert.UserAgentHash,
            InvitationId = insert.InvitationId,
        };
    }

    public static EmailOtpChallengeRecord Clone(
        EmailOtpChallengeRecord existing,
        int? failedAttemptCount = null,
        DateTimeOffset? completedUtc = null,
        DateTimeOffset? invalidatedUtc = null)
    {
        ArgumentNullException.ThrowIfNull(existing);

        return new EmailOtpChallengeRecord
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
            RowVersion = existing.RowVersion,
        };
    }

    public static bool IsActive(EmailOtpChallengeRecord row) =>
        row.CompletedUtc is null && row.InvalidatedUtc is null;

    public static bool MatchesRecentRequestByEmail(
        EmailOtpChallengeRecord row,
        string normalizedEmail,
        DateTimeOffset sinceUtc) =>
        row.NormalizedEmail == normalizedEmail && row.CreatedUtc >= sinceUtc;

    public static bool MatchesRecentRequestByClientIp(
        EmailOtpChallengeRecord row,
        string clientIpHash,
        DateTimeOffset sinceUtc) =>
        row.ClientIpHash == clientIpHash && row.CreatedUtc >= sinceUtc;

    public static bool MatchesFailedVerificationByEmail(
        EmailOtpChallengeRecord row,
        string normalizedEmail,
        DateTimeOffset sinceUtc) =>
        row.NormalizedEmail == normalizedEmail
        && row.FailedAttemptCount > 0
        && row.CreatedUtc >= sinceUtc
        && row.CompletedUtc is null;

    public static EmailOtpRecentRequestCounts CountRecentRequests(
        IEnumerable<EmailOtpChallengeRecord> rows,
        string normalizedEmail,
        string? clientIpHash,
        DateTimeOffset sinceUtc)
    {
        ArgumentNullException.ThrowIfNull(rows);

        int emailCount = 0;
        int ipCount = 0;

        foreach (EmailOtpChallengeRecord row in rows)
        {
            if (MatchesRecentRequestByEmail(row, normalizedEmail, sinceUtc))
                emailCount++;

            if (clientIpHash is not null && MatchesRecentRequestByClientIp(row, clientIpHash, sinceUtc))
                ipCount++;
        }

        return new EmailOtpRecentRequestCounts(emailCount, ipCount);
    }

    public static (EmailOtpChallengeCompletionOutcome Outcome, EmailOtpChallengeRecord? UpdatedRecord) EvaluateCompletion(
        EmailOtpChallengeRecord existing,
        string codeHash,
        DateTimeOffset nowUtc,
        int maxFailedAttempts)
    {
        ArgumentNullException.ThrowIfNull(existing);

        if (existing.CompletedUtc is not null)
        {
            return (new EmailOtpChallengeCompletionOutcome
            {
                Result = EmailOtpChallengeCompletionResult.AlreadyCompleted,
            }, null);
        }

        if (existing.InvalidatedUtc is not null)
        {
            return (new EmailOtpChallengeCompletionOutcome
            {
                Result = EmailOtpChallengeCompletionResult.Invalidated,
            }, null);
        }

        if (existing.ExpiresUtc <= nowUtc)
        {
            return (new EmailOtpChallengeCompletionOutcome
            {
                Result = EmailOtpChallengeCompletionResult.Expired,
            }, null);
        }

        if (!FixedTimeHexEquals.Equals(existing.CodeHash, codeHash))
        {
            int failed = existing.FailedAttemptCount + 1;
            EmailOtpChallengeRecord updated = Clone(
                existing,
                failedAttemptCount: failed,
                invalidatedUtc: failed >= maxFailedAttempts ? nowUtc : null);

            return (new EmailOtpChallengeCompletionOutcome
            {
                Result = failed >= maxFailedAttempts
                    ? EmailOtpChallengeCompletionResult.TooManyAttempts
                    : EmailOtpChallengeCompletionResult.InvalidCode,
            }, updated);
        }

        EmailOtpChallengeRecord completed = Clone(existing, completedUtc: nowUtc);

        return (new EmailOtpChallengeCompletionOutcome
        {
            Result = EmailOtpChallengeCompletionResult.Completed,
            Challenge = completed,
        }, completed);
    }

    public static EmailOtpChallengeRecord MapFromStorage(
        Guid id,
        string normalizedEmail,
        string codeHash,
        DateTime createdUtc,
        DateTime expiresUtc,
        int failedAttemptCount,
        DateTime? completedUtc,
        DateTime? invalidatedUtc,
        string? clientIpHash,
        string? userAgentHash,
        Guid? invitationId,
        byte[] rowVersion) =>
        new()
        {
            Id = id,
            NormalizedEmail = normalizedEmail,
            CodeHash = codeHash,
            CreatedUtc = ToUtcOffset(createdUtc),
            ExpiresUtc = ToUtcOffset(expiresUtc),
            FailedAttemptCount = failedAttemptCount,
            CompletedUtc = completedUtc is null ? null : ToUtcOffset(completedUtc.Value),
            InvalidatedUtc = invalidatedUtc is null ? null : ToUtcOffset(invalidatedUtc.Value),
            ClientIpHash = clientIpHash,
            UserAgentHash = userAgentHash,
            InvitationId = invitationId,
            RowVersion = rowVersion,
        };

    private static DateTimeOffset ToUtcOffset(DateTime value) =>
        new(DateTime.SpecifyKind(value, DateTimeKind.Utc));
}
