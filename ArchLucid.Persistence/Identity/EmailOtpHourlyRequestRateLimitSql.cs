namespace ArchLucid.Persistence.Identity;

/// <summary>
///     Batch SQL for <see cref="IEmailOtpChallengeRepository"/> hourly OTP request counts.
///     The email statement must ignore completed and expired rows, matching the client-IP statement
///     and <see cref="EmailOtpChallengeRepositoryCore"/> used by the in-memory store.
/// </summary>
internal static class EmailOtpHourlyRequestRateLimitSql
{
    internal const string Batch = """
                                SELECT COUNT(1)
                                FROM dbo.EmailOtpChallenges
                                WHERE NormalizedEmail = @NormalizedEmail
                                  AND CreatedUtc >= @SinceUtc
                                  AND CompletedUtc IS NULL
                                  AND ExpiresUtc > @NowUtc;

                                SELECT COUNT(1)
                                FROM dbo.EmailOtpChallenges
                                WHERE ClientIpHash = @ClientIpHash
                                  AND CreatedUtc >= @SinceUtc
                                  AND CompletedUtc IS NULL
                                  AND ExpiresUtc > @NowUtc
                                  AND @ClientIpHash IS NOT NULL;
                                """;
}
