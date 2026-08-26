using System.Security.Cryptography;
using System.Text;
using ArchLucid.Contracts.Persistence.TechnologyLedger;

namespace ArchLucid.Application.ArchitectureIntelligence;

/// <summary>
///     Stable fingerprint of technology-ledger facts that influence closed-world publish gating.
/// </summary>
public static class ReviewCacheLedgerFingerprint
{
    public static string Compute(IReadOnlyList<TechnologyLedgerEntry>? ledgerEntries)
    {
        if (ledgerEntries is null || ledgerEntries.Count == 0)
            return Sha256Hex(string.Empty);

        StringBuilder builder = new();

        foreach (TechnologyLedgerEntry entry in ledgerEntries
                     .OrderBy(item => item.Role)
                     .ThenBy(item => item.TechnologyName, StringComparer.Ordinal)
                     .ThenBy(item => item.ProviderFamily))
        {
            builder.Append(entry.Role).Append('|');
            builder.Append(entry.TechnologyName ?? string.Empty).Append('|');
            builder.Append(entry.ProviderFamily).Append('|');
            builder.Append(entry.Status).Append('|');
            builder.Append(entry.Source).Append('|');
            builder.Append(entry.IsLocked ? '1' : '0').Append('|');
            builder.Append(entry.EvidenceRef ?? string.Empty).Append('\n');
        }

        return Sha256Hex(builder.ToString());
    }

    private static string Sha256Hex(string value)
    {
        byte[] bytes = SHA256.HashData(Encoding.UTF8.GetBytes(value));

        return Convert.ToHexString(bytes).ToLowerInvariant();
    }
}
