using System.Globalization;
using System.Text;

using ArchLucid.Application.Reporting;
using ArchLucid.Core.Audit;

using Microsoft.AspNetCore.Mvc.Formatters;
using Microsoft.Net.Http.Headers;

namespace ArchLucid.Api.Formatters;

/// <summary>
///     Serializes <see cref="AuditEvent" /> collections as RFC 4180-style CSV (<c>text/csv</c>) for audit exports.
/// </summary>
public sealed class AuditEventCsvFormatter : TextOutputFormatter
{
    /// <summary>Populated by <c>AuditController.ExportAudit</c> so CSV responses can emit <c>Content-Disposition</c>.</summary>
    public const string CsvAttachmentFileNameItemKey = "ArchLucid.AuditExport.CsvAttachmentFileName";

    private const string HeaderLine =
        "EventId,OccurredUtc,EventType,ActorUserId,ActorUserName,RunId,ManifestId,CorrelationId,DataJson";

    private readonly ExportFormatterService _exportFormatter;

    public AuditEventCsvFormatter(ExportFormatterService exportFormatter)
    {
        ArgumentNullException.ThrowIfNull(exportFormatter);

        _exportFormatter = exportFormatter;
        SupportedMediaTypes.Add(MediaTypeHeaderValue.Parse("text/csv"));
        SupportedEncodings.Add(Encoding.UTF8);
    }

    protected override bool CanWriteType(Type? type)
    {
        if (type is null)
            return false;

        return type != typeof(string) && typeof(IEnumerable<AuditEvent>).IsAssignableFrom(type);
    }

    public override async Task WriteResponseBodyAsync(
        OutputFormatterWriteContext context,
        Encoding selectedEncoding)
    {
        ArgumentNullException.ThrowIfNull(context);
        ArgumentNullException.ThrowIfNull(selectedEncoding);

        if (context.Object is not IEnumerable<AuditEvent> events)
            throw new InvalidOperationException(
                $"{nameof(AuditEventCsvFormatter)} expected {nameof(IEnumerable<>)}.");

        if (context.HttpContext.Items.TryGetValue(CsvAttachmentFileNameItemKey, out object? nameObj)
            && nameObj is string fileName
            && !string.IsNullOrWhiteSpace(fileName))
        {
            ContentDispositionHeaderValue disposition = new("attachment") { FileName = fileName };
            context.HttpContext.Response.Headers.ContentDisposition = disposition.ToString();
        }

        Stream responseStream = context.HttpContext.Response.Body;
        await using StreamWriter writer = new(responseStream, selectedEncoding, 16_384, true);
        writer.NewLine = "\n";

        await writer.WriteLineAsync(HeaderLine);

        foreach (AuditEvent auditEvent in events)
        {
            ArgumentNullException.ThrowIfNull(auditEvent);

            string line = string.Join(
                ',',
                EscapeCsvField(auditEvent.EventId.ToString("D", CultureInfo.InvariantCulture)),
                EscapeCsvField(_exportFormatter.FormatIso8601Utc(auditEvent.OccurredUtc)),
                EscapeCsvField(auditEvent.EventType),
                EscapeCsvField(auditEvent.ActorUserId),
                EscapeCsvField(auditEvent.ActorUserName),
                EscapeCsvField(FormatNullableGuid(auditEvent.RunId)),
                EscapeCsvField(FormatNullableGuid(auditEvent.ManifestId)),
                EscapeCsvField(auditEvent.CorrelationId),
                EscapeCsvField(auditEvent.DataJson));

            await writer.WriteLineAsync(line);
        }

        await writer.FlushAsync();
    }

    private static string FormatNullableGuid(Guid? value)
    {
        return !value.HasValue ? string.Empty : value.Value.ToString("D", CultureInfo.InvariantCulture);
    }

    /// <summary>
    ///     RFC 4180-style escaping: double quotes around fields that contain comma, quote, or newline; quotes doubled.
    /// </summary>
    internal static string EscapeCsvField(string? value) => ExportFormatterService.EscapeCsvField(value);
}
