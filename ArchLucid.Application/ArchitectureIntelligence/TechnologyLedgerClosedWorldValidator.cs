using ArchLucid.Contracts.Advisory.Workflow;
using ArchLucid.Contracts.Persistence.TechnologyLedger;

namespace ArchLucid.Application.ArchitectureIntelligence;

/// <summary>
///     Validates closed-loop / specialist text against the closed-world technology ledger.
/// </summary>
public static class TechnologyLedgerClosedWorldValidator
{
    private static readonly string[] CloudTokens = ["azure", "aws", "gcp", "google cloud"];

    public static bool MentionsOffLedgerTechnology(
        string text,
        IReadOnlyList<TechnologyLedgerEntry> ledgerEntries)
    {
        ArgumentNullException.ThrowIfNull(text);
        ArgumentNullException.ThrowIfNull(ledgerEntries);

        if (ledgerEntries.Count == 0)
            return MentionsCloudProvider(text);

        HashSet<string> ledgerTokens = ledgerEntries
            .SelectMany(entry => new[] { entry.TechnologyName, entry.Role.ToString() })
            .Where(token => !string.IsNullOrWhiteSpace(token))
            .Select(token => token.Trim().ToLowerInvariant())
            .ToHashSet(StringComparer.Ordinal);

        string lowered = text.ToLowerInvariant();

        foreach (string cloud in CloudTokens)
        {
            if (lowered.Contains(cloud, StringComparison.Ordinal)
                && !ledgerTokens.Any(token => token.Contains(cloud, StringComparison.Ordinal)))
            {
                return true;
            }
        }

        return false;
    }

    private static bool MentionsCloudProvider(string text)
    {
        string lowered = text.ToLowerInvariant();

        return CloudTokens.Any(token => lowered.Contains(token, StringComparison.Ordinal));
    }
}
