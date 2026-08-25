using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Identity;

namespace ArchLucid.Application.Identity;

/// <summary>
///     Shared rate-limit evaluation and audit/instrumentation for identity/auth flows.
/// </summary>
public static class AuthRateLimitHelper
{
    public static async Task LogEmailOtpRateLimitAsync(
        IAuditService auditService,
        string emailCorrelation,
        string scope,
        CancellationToken cancellationToken)
    {
        ArchLucidInstrumentation.RecordEmailOtpRateLimitTriggered(scope);

        await AuthAuditEmitter.LogIdentityEventAsync(
                auditService,
                AuditEventTypes.EmailOtpRateLimitTriggered,
                emailCorrelation,
                new { emailCorrelation, scope },
                cancellationToken)
            .ConfigureAwait(false);
    }

    public static async Task<bool> IsEmailOtpRequestRateLimitedAsync(
        IEmailOtpChallengeRepository challenges,
        EmailOtpAuthOptions options,
        string normalizedEmail,
        string? clientIp,
        DateTimeOffset now,
        string emailCorrelation,
        IAuditService auditService,
        CancellationToken cancellationToken)
    {
        DateTimeOffset since = now.AddHours(-1);
        string? clientIpHash = EmailOtpRequestMetadataHasher.HashOptional(clientIp);

        EmailOtpRecentRequestCounts counts = await challenges
            .CountRecentRequestsForRateLimitAsync(normalizedEmail, clientIpHash, since, cancellationToken)
            .ConfigureAwait(false);

        if (counts.EmailRequestCount >= options.MaxCodeRequestsPerEmailPerHour)
        {
            await LogEmailOtpRateLimitAsync(auditService, emailCorrelation, "email_request_hourly", cancellationToken)
                .ConfigureAwait(false);

            return true;
        }

        if (clientIpHash is null)
        {
            return false;
        }

        if (counts.ClientIpRequestCount >= options.MaxCodeRequestsPerIpPerHour)
        {
            await LogEmailOtpRateLimitAsync(auditService, emailCorrelation, "ip_request_hourly", cancellationToken)
                .ConfigureAwait(false);

            return true;
        }

        return false;
    }

    public static async Task<bool> IsEmailOtpVerificationRateLimitedAsync(
        IEmailOtpChallengeRepository challenges,
        EmailOtpAuthOptions options,
        string normalizedEmail,
        DateTimeOffset now,
        string emailCorrelation,
        IAuditService auditService,
        CancellationToken cancellationToken)
    {
        DateTimeOffset since = now.AddHours(-1);

        int recentFailures = await challenges
            .CountRecentFailedVerificationsByEmailAsync(normalizedEmail, since, cancellationToken)
            .ConfigureAwait(false);

        if (recentFailures < options.MaxVerificationAttemptsPerEmailPerHour)
        {
            return false;
        }

        await LogEmailOtpRateLimitAsync(auditService, emailCorrelation, "email_verification_hourly", cancellationToken)
            .ConfigureAwait(false);

        return true;
    }
}
