using Microsoft.Extensions.Logging;

namespace ArchLucid.Core.Diagnostics;

/// <summary>
///     Structured <see cref="ILogger" /> helpers for trial bootstrap denial paths (CWE-117 and CodeQL exposure noise).
/// </summary>
/// <remarks>
///     Static methods (not <c>this ILogger</c> extensions) keep <c>cs/exposure-of-sensitive-information</c> from anchoring at
///     trial bootstrap call sites before sanitization runs. Sanitized email domains reach the sink through a
///     <see cref="LoggerMessageAttribute" /> emitter (see <c>SanitizedLoggerTrialBootstrapExtensions.LoggerMessage.cs</c>)
///     so the <see cref="LogSanitizer.EmailDomainForLogs" /> barrier is not defeated by <c>params object?[]</c> boxing.
/// </remarks>
public static partial class SanitizedLoggerTrialBootstrapExtensions
{
    /// <summary>Information: email verification policy blocked trial bootstrap for a newly registered tenant.</summary>
    public static void LogInformationTrialBootstrapEmailVerificationBlocked(
        ILogger logger,
        Guid tenantId,
        string auditActorEmail)
    {
        ArgumentNullException.ThrowIfNull(logger);

        string emailDomainForLogs = LogSanitizer.EmailDomainForLogs(auditActorEmail);

        EmitTrialBootstrapEmailVerificationBlocked(logger, tenantId, emailDomainForLogs);
    }
}
