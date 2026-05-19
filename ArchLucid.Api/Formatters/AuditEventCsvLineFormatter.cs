using System.Globalization;
using System.Text;

using ArchLucid.Application.Reporting;
using ArchLucid.Core.Audit;

namespace ArchLucid.Api.Formatters;

/// <summary>Shared RFC 4180-style CSV line formatting for audit export responses.</summary>
public static class AuditEventCsvLineFormatter
{
    public const string HeaderLine =
        "EventId,OccurredUtc,EventType,ActorUserId,ActorUserName,RunId,ManifestId,CorrelationId,DataJson";

    public static string FormatEventLine(ExportFormatterService exportFormatter, AuditEvent auditEvent)
    {
        ArgumentNullException.ThrowIfNull(exportFormatter);
        ArgumentNullException.ThrowIfNull(auditEvent);

        return string.Join(
            ',',
            EscapeCsvField(auditEvent.EventId.ToString("D", CultureInfo.InvariantCulture)),
            EscapeCsvField(exportFormatter.FormatIso8601Utc(auditEvent.OccurredUtc)),
            EscapeCsvField(auditEvent.EventType),
            EscapeCsvField(auditEvent.ActorUserId),
            EscapeCsvField(auditEvent.ActorUserName),
            EscapeCsvField(FormatNullableGuid(auditEvent.RunId)),
            EscapeCsvField(FormatNullableGuid(auditEvent.ManifestId)),
            EscapeCsvField(auditEvent.CorrelationId),
            EscapeCsvField(auditEvent.DataJson));
    }

    public static async Task WriteHeaderLineAsync(TextWriter writer, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(writer);

        await writer.WriteLineAsync(HeaderLine.AsMemory(), cancellationToken);
    }

    private static string FormatNullableGuid(Guid? value)
    {
        return !value.HasValue ? string.Empty : value.Value.ToString("D", CultureInfo.InvariantCulture);
    }

    private static string EscapeCsvField(string? value) => ExportFormatterService.EscapeCsvField(value);
}
