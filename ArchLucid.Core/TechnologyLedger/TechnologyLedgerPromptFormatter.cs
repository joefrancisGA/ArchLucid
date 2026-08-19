using System.Text;

using ArchLucid.Contracts.Persistence.TechnologyLedger;

namespace ArchLucid.Core.TechnologyLedger;

public static class TechnologyLedgerPromptFormatter
{
    private const int MaxEntryLines = 32;

    public static void AppendTechnologyLedgerContext(StringBuilder sb, IReadOnlyList<TechnologyLedgerEntry> entries)
    {
        ArgumentNullException.ThrowIfNull(sb);
        ArgumentNullException.ThrowIfNull(entries);

        if (entries.Count == 0)
            return;

        sb.AppendLine();
        sb.AppendLine("Technology Ledger (canonical baseline for this run):");
        AppendEntryLines(sb, entries);
    }

    public static string FormatTechnologyLedgerContext(IReadOnlyList<TechnologyLedgerEntry> entries)
    {
        ArgumentNullException.ThrowIfNull(entries);

        if (entries.Count == 0)
            return string.Empty;

        StringBuilder sb = new();
        AppendTechnologyLedgerContext(sb, entries);

        return sb.ToString().TrimEnd();
    }

    public static void AppendLedgerEntryLines(StringBuilder sb, IReadOnlyList<TechnologyLedgerEntry> entries)
    {
        AppendEntryLines(sb, entries);
    }

    private static void AppendEntryLines(StringBuilder sb, IReadOnlyList<TechnologyLedgerEntry> entries)
    {
        List<TechnologyLedgerEntry> sorted = entries
            .OrderBy(entry => entry.Role)
            .ThenBy(entry => entry.CreatedUtc)
            .ToList();

        int rendered = 0;

        foreach (TechnologyLedgerEntry entry in sorted)
        {
            if (rendered >= MaxEntryLines)
                break;

            string evidenceSuffix = string.IsNullOrWhiteSpace(entry.EvidenceRef)
                ? string.Empty
                : $"; EvidenceRef={entry.EvidenceRef}";

            sb.AppendLine(
                $"- {entry.Role}: {entry.TechnologyName} ({entry.ProviderFamily}, {entry.Status}, {entry.Source}{evidenceSuffix})");

            rendered++;
        }

        if (sorted.Count > MaxEntryLines)
            sb.AppendLine($"(Technology Ledger truncated: showing {MaxEntryLines} of {sorted.Count} entries.)");

        sb.AppendLine(
            "Treat Chosen rows as authoritative. Label any new technology you introduce as an Assumed proposal. " +
            "Do not substitute a different provider family's equivalent without explicitly proposing it.");
    }
}
