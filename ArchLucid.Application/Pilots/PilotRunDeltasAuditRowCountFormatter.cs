using System.Globalization;

using ArchLucid.Contracts.Pilots;

namespace ArchLucid.Application.Pilots;

/// <summary>Shared audit-row count copy for markdown computed-deltas tables and sponsor PDF delta rows.</summary>
internal static class PilotRunDeltasAuditRowCountFormatter
{
    internal const string NotAttestedPlain = "Audit row count was not attested.";

    internal const string TruncationCaveatPlain =
        "query cap reached — exact count is at least this many";

    internal static string FormatMarkdownTableCell(PilotRunDeltas deltas)
    {
        ArgumentNullException.ThrowIfNull(deltas);

        if (!deltas.AuditRowCountResolved)
            return NotAttestedPlain;

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
            return NotAttestedPlain;

        if (deltas.AuditRowCount == 0)
            return "0";

        return deltas.AuditRowCountTruncated
            ? $"{deltas.AuditRowCount.ToString(CultureInfo.InvariantCulture)}+ ({TruncationCaveatPlain})"
            : deltas.AuditRowCount.ToString(CultureInfo.InvariantCulture);
    }

    internal static string FormatSponsorSafeConcreteGapLineWhenUnresolved() => NotAttestedPlain;

    internal static string FormatSponsorSafeConcreteGapLineWhenZero() =>
        "Scoped audit-event count for this run is **zero** — durable audit continuity is not demonstrated.";

    internal static string FormatProofPackageCell(PilotRunDeltas deltas, ProofPackageCompletenessResponse proof)
    {
        ArgumentNullException.ThrowIfNull(deltas);
        ArgumentNullException.ThrowIfNull(proof);

        if (proof is { AuditRowCountResolved: true, AuditRowsPresentOrLowerBound: false }
            && deltas is { AuditRowCountResolved: true, AuditRowCount: 0 })
        {
            return FormatSponsorSafeConcreteGapLineWhenZero();
        }

        return FormatMarkdownTableCell(deltas);
    }
}
