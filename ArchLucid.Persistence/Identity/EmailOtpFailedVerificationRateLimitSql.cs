namespace ArchLucid.Persistence.Identity;

/// <summary>
///     SQL for hourly OTP verification-failure counts.
///     An expired unused challenge is not an active replacement. The in-memory store uses
///     <see cref="EmailOtpChallengeRepositoryCore.IsActive"/> plus <c>ExpiresUtc &gt; now</c>.
/// </summary>
internal static class EmailOtpFailedVerificationRateLimitSql
{
    internal const string Command = """
                                    SELECT COUNT(1)
                                    FROM dbo.EmailOtpChallenges c
                                    WHERE c.NormalizedEmail = @NormalizedEmail
                                      AND c.CreatedUtc >= @SinceUtc
                                      AND c.FailedAttemptCount > 0
                                      AND c.CompletedUtc IS NULL
                                      AND c.ExpiresUtc > @NowUtc
                                      AND (
                                          c.InvalidatedUtc IS NULL
                                          OR NOT EXISTS (
                                              SELECT 1
                                              FROM dbo.EmailOtpChallenges active
                                              WHERE active.NormalizedEmail = @NormalizedEmail
                                                AND active.CompletedUtc IS NULL
                                                AND active.InvalidatedUtc IS NULL
                                                AND active.ExpiresUtc > @NowUtc));
                                    """;
}
