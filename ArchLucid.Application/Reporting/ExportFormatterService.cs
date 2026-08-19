using System.Globalization;
using System.Text;

namespace ArchLucid.Application.Reporting;

/// <summary>Shared CSV / markdown table layout / attachment naming and ISO-8601 UTC formatting for dashboard exports.</summary>
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

    /// <summary>ISO 8601 for <see cref="DateTimeOffset" /> (always UTC-normalized for the formatted instant).</summary>
    public string FormatIso8601Utc(DateTimeOffset instant)
    {
        return instant.UtcDateTime.ToString("O", CultureInfo.InvariantCulture);
    }

    /// <summary>Backtick-wrapped ISO 8601 for markdown table cells, or em dash.</summary>
    public string FormatIso8601UtcMarkdownQuotedCell(DateTime utcInstant)
    {
        return "`" + FormatIso8601Utc(utcInstant) + "`";
    }

    /// <summary>Backtick-wrapped ISO 8601 when present, otherwise em dash.</summary>
    public string FormatIso8601UtcMarkdownQuotedCell(DateTime? utcInstant)
    {
        if (!utcInstant.HasValue)
            return "—";

        return FormatIso8601UtcMarkdownQuotedCell(utcInstant.Value);
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

    /// <summary>Standard GFM pipe table header + <c>| --- | --- |</c> separator (two columns).</summary>
    public void AppendMarkdownTwoColumnTableStart(StringBuilder sb, string leftHeader, string rightHeader)
    {
        ArgumentNullException.ThrowIfNull(sb);
        sb.AppendLine(CultureInfo.InvariantCulture, $"| {leftHeader} | {rightHeader} |");
        sb.AppendLine("| --- | --- |");
    }

    /// <summary>Standard GFM pipe table header + separator for four equal columns.</summary>
    public void AppendMarkdownFourColumnTableStart(
        StringBuilder sb,
        string h1,
        string h2,
        string h3,
        string h4)
    {
        ArgumentNullException.ThrowIfNull(sb);
        sb.AppendLine(CultureInfo.InvariantCulture, $"| {h1} | {h2} | {h3} | {h4} |");
        sb.AppendLine("| --- | --- | --- | --- |");
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
