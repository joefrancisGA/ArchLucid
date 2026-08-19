using Microsoft.Extensions.Logging;

namespace ArchLucid.Core.Diagnostics;

/// <summary>
///     Structured <see cref="ILogger" /> helpers for support problem report notification paths.
/// </summary>
/// <remarks>
///     Static methods keep <c>cs/exposure-of-sensitive-information</c> from anchoring at Application call sites
///     before <see cref="LogSanitizer.EmailDomainForLogs" /> runs. Sanitized domains reach the sink through a
///     <see cref="LoggerMessageAttribute" /> emitter (see
///     <c>SanitizedLoggerSupportProblemReportExtensions.LoggerMessage.cs</c>) so <c>params object?[]</c> boxing
///     does not defeat the CodeQL sanitizer model.
/// </remarks>
public static partial class SanitizedLoggerSupportProblemReportExtensions
{
    /// <summary>Information: Noop email provider would acknowledge a problem report to the submitter domain.</summary>
    public static void LogInformationProblemReportAckWouldSend(
        ILogger logger,
        Guid reportId,
        string submitterMailbox,
        string providerName)
    {
        ArgumentNullException.ThrowIfNull(logger);
        ArgumentException.ThrowIfNullOrWhiteSpace(submitterMailbox);
        ArgumentException.ThrowIfNullOrWhiteSpace(providerName);

        string emailDomainForLogs = LogSanitizer.EmailDomainForLogs(submitterMailbox);

        EmitProblemReportAckWouldSend(logger, reportId, emailDomainForLogs, providerName);
    }
}
