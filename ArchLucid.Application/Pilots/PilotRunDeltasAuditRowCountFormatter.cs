using System.Globalization;

namespace ArchLucid.Application.Pilots;

/// <summary>Shared audit-row count copy for markdown computed-deltas tables and sponsor PDF delta rows.</summary>
internal static class PilotRunDeltasAuditRowCountFormatter
{
    internal const string TruncationCaveatPlain =
        "query cap reached — exact count is at least this many";

    internal static string FormatMarkdownTableCell(PilotRunDeltas deltas)
    {
        ArgumentNullException.ThrowIfNull(deltas);

        if (!deltas.AuditRowCountResolved)
            return "Audit row count was not attested.";

        if (deltas.AuditRowCount == 0)
            return "0";

        return deltas.AuditRowCountTruncated
            ? $"{deltas.AuditRowCount.ToString(CultureInfo.InvariantCulture)}+ _({TruncationCaveatPlain})_"
            : deltas.AuditRowCount.ToString(CultureInfo.InvariantCulture);
    }

    internal static string FormatPlainText(PilotRunDeltas deltas)
    {
        ArgumentNullException.ThrowIfNull(deltas);

        if (!deltas.AuditRowCountResolved)
            return "Audit row count was not attested.";

        if (deltas.AuditRowCount == 0)
            return "0";

        return deltas.AuditRowCountTruncated
            ? $"{deltas.AuditRowCount.ToString(CultureInfo.InvariantCulture)}+ ({TruncationCaveatPlain})"
            : deltas.AuditRowCount.ToString(CultureInfo.InvariantCulture);
    }
}
