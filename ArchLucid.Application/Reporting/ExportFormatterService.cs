using System.Globalization;

namespace ArchLucid.Application.Reporting;

/// <summary>Shared CSV / attachment naming and ISO-8601 UTC formatting for dashboard and audit exports.</summary>
public sealed class ExportFormatterService
{
    /// <summary>Normalizes instants to UTC for export windows (inclusive/exclusive handlers use the result consistently).</summary>
    public DateTime NormalizeExportInstantUtc(DateTime value)
    {
        return value.Kind switch
        {
            DateTimeKind.Utc => value,
            DateTimeKind.Local => value.ToUniversalTime(),
            _ => DateTime.SpecifyKind(value, DateTimeKind.Utc)
        };
    }

    /// <summary>RFC 3339 / round-trip ISO 8601 for CSV and human-readable export columns.</summary>
    public string FormatIso8601Utc(DateTime utcInstant)
    {
        DateTime utc = NormalizeExportInstantUtc(utcInstant);

        return utc.ToString("O", CultureInfo.InvariantCulture);
    }

    /// <summary>Compact UTC timestamp segments for deterministic attachment file names.</summary>
    public string FormatAttachmentSegmentUtc(DateTime utcInstant)
    {
        DateTime utc = NormalizeExportInstantUtc(utcInstant);

        return utc.ToString("yyyyMMdd'T'HHmmss'Z'", CultureInfo.InvariantCulture);
    }

    public string BuildAuditExportCsvFileName(DateTime fromUtc, DateTime toUtc)
    {
        string fromPart = FormatAttachmentSegmentUtc(fromUtc);
        string toPart = FormatAttachmentSegmentUtc(toUtc);

        return $"audit-export-{fromPart}-{toPart}.csv";
    }

    public string BuildAuditExportCefFileName(DateTime fromUtc, DateTime toUtc)
    {
        string fromPart = FormatAttachmentSegmentUtc(fromUtc);
        string toPart = FormatAttachmentSegmentUtc(toUtc);

        return $"audit-export-{fromPart}-{toPart}.cef";
    }

    /// <summary>RFC 4180-style escaping for CSV cells.</summary>
    public static string EscapeCsvField(string? value)
    {
        if (string.IsNullOrEmpty(value))
            return string.Empty;

        bool mustQuote =
            value.Contains(',')
            || value.Contains('"')
            || value.Contains('\r')
            || value.Contains('\n');

        if (!mustQuote)
            return value;

        return "\"" + value.Replace("\"", "\"\"", StringComparison.Ordinal) + "\"";
    }
}
