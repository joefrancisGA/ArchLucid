namespace ArchLucid.Cli.Commands;

internal static class DecisionOwnerScoreboardParser
{
    internal static IReadOnlyList<DecisionOwnerLedgerRecord> LoadDirectory(string ledgerDirectory)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(ledgerDirectory);

        if (!Directory.Exists(ledgerDirectory))
            return [];

        List<DecisionOwnerLedgerRecord> records = new();

        foreach (string filePath in Directory.EnumerateFiles(ledgerDirectory, "*.json", SearchOption.AllDirectories))
        {
            DecisionOwnerLedgerRecord? record = DecisionOwnerScoreboardParseCore.TryParseLedger(filePath);

            if (record is not null)
                records.Add(record);
        }

        return records
            .OrderBy(static record => record.SourcePath, StringComparer.Ordinal)
            .ToList();
    }
}
