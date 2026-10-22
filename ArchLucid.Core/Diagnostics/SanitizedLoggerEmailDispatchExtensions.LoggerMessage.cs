using Microsoft.Extensions.Logging;

namespace ArchLucid.Core.Diagnostics;

/// <summary>
///     Source-generated <see cref="ILogger" /> emitters for
///     <see cref="SanitizedLoggerEmailDispatchExtensions" />.
/// </summary>
public static partial class SanitizedLoggerEmailDispatchExtensions
{
    [LoggerMessage(
        EventId = 3301,
        Level = LogLevel.Error,
        Message = "{Operation} email send failed for tenant {TenantId}, mailbox domain {EmailDomain}.")]
    private static partial void EmitTemplatedEmailSendFailed(
        ILogger logger,
        Exception exception,
        Guid tenantId,
        string operation,
        string emailDomain);

    [LoggerMessage(
        EventId = 3302,
        Level = LogLevel.Error,
        Message =
            "Recurrence completion email send failed for tenant {TenantId}, schedule {ScheduleId}, mailbox domain {EmailDomain}.")]
    private static partial void EmitRecurrenceEmailSendFailed(
        ILogger logger,
        Exception exception,
        Guid tenantId,
        Guid scheduleId,
        string emailDomain);
}
