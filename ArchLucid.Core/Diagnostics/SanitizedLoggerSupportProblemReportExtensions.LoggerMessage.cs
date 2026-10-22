using Microsoft.Extensions.Logging;

namespace ArchLucid.Core.Diagnostics;

/// <summary>
///     Source-generated <see cref="ILogger" /> emitters for
///     <see cref="SanitizedLoggerSupportProblemReportExtensions" />.
/// </summary>
public static partial class SanitizedLoggerSupportProblemReportExtensions
{
    [LoggerMessage(
        EventId = 3017,
        Level = LogLevel.Information,
        Message =
            "Would send problem report acknowledgement to domain {EmailDomain} for report id {ReportId} (Email:Provider is {Provider}).")]
    private static partial void EmitProblemReportAckWouldSend(
        ILogger logger,
        Guid reportId,
        string emailDomain,
        string provider);
}
