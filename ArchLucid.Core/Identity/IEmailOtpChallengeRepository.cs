namespace ArchLucid.Core.Identity;

public interface IEmailOtpChallengeRepository
{
    Task<EmailOtpChallengeRecord> InsertAsync(EmailOtpChallengeInsert insert, CancellationToken cancellationToken);

    Task<EmailOtpChallengeRecord?> GetByIdAsync(Guid challengeId, CancellationToken cancellationToken);

    Task<int> CountRecentRequestsByEmailAsync(
        string normalizedEmail,
        DateTimeOffset sinceUtc,
        CancellationToken cancellationToken);

    Task<int> CountRecentRequestsByClientIpHashAsync(
        string clientIpHash,
        DateTimeOffset sinceUtc,
        CancellationToken cancellationToken);

    /// <summary>Single round-trip read of hourly email and client-IP OTP request counts.</summary>
    Task<EmailOtpRecentRequestCounts> CountRecentRequestsForRateLimitAsync(
        string normalizedEmail,
        string? clientIpHash,
        DateTimeOffset sinceUtc,
        CancellationToken cancellationToken);

    Task<int> CountRecentFailedVerificationsByEmailAsync(
        string normalizedEmail,
        DateTimeOffset sinceUtc,
        CancellationToken cancellationToken);

    Task<DateTimeOffset?> GetLatestRequestUtcByEmailAsync(
        string normalizedEmail,
        CancellationToken cancellationToken);

    Task InvalidateActiveChallengesForEmailAsync(
        string normalizedEmail,
        DateTimeOffset invalidatedUtc,
        CancellationToken cancellationToken);

    Task<EmailOtpChallengeCompletionOutcome> TryCompleteAsync(
        Guid challengeId,
        string codeHash,
        DateTimeOffset nowUtc,
        int maxFailedAttempts,
        CancellationToken cancellationToken);
}
