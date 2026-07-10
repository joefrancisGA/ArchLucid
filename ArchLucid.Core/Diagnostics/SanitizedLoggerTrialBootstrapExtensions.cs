using Microsoft.Extensions.Logging;

namespace ArchLucid.Core.Diagnostics;

/// <summary>
///     Structured <see cref="ILogger" /> helpers for trial bootstrap denial paths (CWE-117 and CodeQL exposure noise).
/// </summary>
/// <remarks>
///     Static methods (not <c>this ILogger</c> extensions) keep <c>cs/exposure-of-sensitive-information</c> from anchoring at
///     trial bootstrap call sites before sanitization runs.
/// </remarks>
public static class SanitizedLoggerTrialBootstrapExtensions
{
    /// <summary>Information: email verification policy blocked trial bootstrap for a newly registered tenant.</summary>
    public static void LogInformationTrialBootstrapEmailVerificationBlocked(
        ILogger logger,
        Guid tenantId,
        string auditActorEmail)
    {
        ArgumentNullException.ThrowIfNull(logger);

        string emailDomainForLogs = LogSanitizer.EmailDomainForLogs(auditActorEmail);

        // codeql[cs/exposure-of-sensitive-information]: email domain only via LogSanitizer.EmailDomainForLogs; not mailbox local-part (docs/library/CODEQL_TRIAGE.md).
        logger.LogInformation(
            "Skipping trial bootstrap for tenant {TenantId}: email verification policy blocked provisioning for domain {EmailDomain}.",
            tenantId,
            emailDomainForLogs);
    }
}
