using Microsoft.Extensions.Logging;

namespace ArchLucid.Core.Diagnostics;

/// <summary>
///     Structured error logs for templated email dispatch failures (domain only, never the mailbox local part).
/// </summary>
/// <remarks>
///     Static methods keep <c>cs/exposure-of-sensitive-information</c> from anchoring at Application call sites.
///     Sanitized domains reach the sink through a <see cref="LoggerMessageAttribute" /> emitter.
/// </remarks>
public static partial class SanitizedLoggerEmailDispatchExtensions
{
    /// <summary>Error: templated email send failed; logs tenant id and mailbox domain only.</summary>
    public static void LogErrorTemplatedEmailSendFailed(
        ILogger logger,
        Exception exception,
        Guid tenantId,
        string operation,
        string mailbox)
    {
        ArgumentNullException.ThrowIfNull(logger);
        ArgumentNullException.ThrowIfNull(exception);
        ArgumentException.ThrowIfNullOrWhiteSpace(operation);
        ArgumentException.ThrowIfNullOrWhiteSpace(mailbox);

        string emailDomainForLogs = LogSanitizer.EmailDomainForLogs(mailbox);

        // Domain only (EmailDomainForLogs); mailbox local-part never reaches ILogger.
        // codeql[cs/exposure-of-sensitive-information]
        EmitTemplatedEmailSendFailed(logger, exception, tenantId, operation, emailDomainForLogs);
    }

    /// <summary>Error: recurrence email send failed; logs tenant, schedule, and mailbox domain only.</summary>
    public static void LogErrorRecurrenceEmailSendFailed(
        ILogger logger,
        Exception exception,
        Guid tenantId,
        Guid scheduleId,
        string mailbox)
    {
        ArgumentNullException.ThrowIfNull(logger);
        ArgumentNullException.ThrowIfNull(exception);
        ArgumentException.ThrowIfNullOrWhiteSpace(mailbox);

        string emailDomainForLogs = LogSanitizer.EmailDomainForLogs(mailbox);

        // Domain only (EmailDomainForLogs); mailbox local-part never reaches ILogger.
        // codeql[cs/exposure-of-sensitive-information]
        EmitRecurrenceEmailSendFailed(logger, exception, tenantId, scheduleId, emailDomainForLogs);
    }
}
