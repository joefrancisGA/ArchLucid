using System.Text;

using ArchLucid.Application.Reporting;
using ArchLucid.Core.Audit;

using Microsoft.Net.Http.Headers;

namespace ArchLucid.Api.Formatters;

/// <summary>Writes streaming <c>text/csv</c> audit exports directly to the HTTP response body.</summary>
public static class AuditEventCsvResponseWriter
{
    public static async Task WriteAsync(
        HttpResponse response,
        ExportFormatterService exportFormatter,
        IAsyncEnumerable<AuditEvent> events,
        string attachmentFileName,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(response);
        ArgumentNullException.ThrowIfNull(exportFormatter);
        ArgumentNullException.ThrowIfNull(events);
        ArgumentException.ThrowIfNullOrWhiteSpace(attachmentFileName);

        response.ContentType = "text/csv; charset=utf-8";
        ContentDispositionHeaderValue disposition = new("attachment") { FileName = attachmentFileName };
        response.Headers.ContentDisposition = disposition.ToString();

        await using StreamWriter writer = new(response.Body, Encoding.UTF8, bufferSize: 16_384, leaveOpen: true);
        writer.NewLine = "\n";

        await AuditEventCsvLineFormatter.WriteHeaderLineAsync(writer, cancellationToken);

        await foreach (AuditEvent auditEvent in events.WithCancellation(cancellationToken))
            await writer.WriteLineAsync(AuditEventCsvLineFormatter.FormatEventLine(exportFormatter, auditEvent).AsMemory(), cancellationToken);

        await writer.FlushAsync(cancellationToken);
    }
}
