using System.Security.Cryptography;
using System.Text;
using ArchLucid.Contracts.Persistence.TechnologyLedger;

namespace ArchLucid.Application.ArchitectureIntelligence;

/// <summary>
///     Stable fingerprint of technology-ledger facts that influence closed-world publish gating.
///     Aligns with <see cref="TechnologyLedgerClosedWorldValidator" /> token sources
///     (<see cref="TechnologyLedgerEntry.TechnologyName" /> and role labels).
/// </summary>
public static class ReviewCacheLedgerFingerprint
{
    public static string Compute(IReadOnlyList<TechnologyLedgerEntry>? ledgerEntries)
    {
        if (ledgerEntries is null || ledgerEntries.Count == 0)
            return Sha256Hex(string.Empty);

        StringBuilder builder = new();

        foreach (TechnologyLedgerEntry entry in ledgerEntries
                     .Where(static item => item is not null)
                     .OrderBy(item => item.Role)
                     .ThenBy(item => NormalizeTechnologyName(item.TechnologyName), StringComparer.Ordinal)
                     .ThenBy(item => item.ProviderFamily)
                     .ThenBy(item => NormalizeEvidenceRef(item.EvidenceRef), StringComparer.Ordinal)
                     .ThenBy(item => item.Status)
                     .ThenBy(item => item.Source)
                     .ThenBy(item => item.IsLocked))
        {
            builder.Append(entry.Role.ToString()).Append('|');
            builder.Append(NormalizeTechnologyName(entry.TechnologyName)).Append('|');
            builder.Append(entry.ProviderFamily).Append('|');
            builder.Append(entry.Status).Append('|');
            builder.Append(entry.Source).Append('|');
            builder.Append(entry.IsLocked ? '1' : '0').Append('|');
            builder.Append(NormalizeEvidenceRef(entry.EvidenceRef)).Append('\n');
        }

        return Sha256Hex(builder.ToString());
    }

    private static string NormalizeTechnologyName(string? technologyName)
    {
        if (string.IsNullOrWhiteSpace(technologyName))
            return string.Empty;

        return technologyName.Trim().Normalize(NormalizationForm.FormC);
    }

    private static string NormalizeEvidenceRef(string? evidenceRef)
    {
        if (string.IsNullOrWhiteSpace(evidenceRef))
            return string.Empty;

        return evidenceRef.Trim().Normalize(NormalizationForm.FormC);
    }

    private static string Sha256Hex(string value)
    {
        byte[] bytes = SHA256.HashData(Encoding.UTF8.GetBytes(value));

        return Convert.ToHexString(bytes).ToLowerInvariant();
    }
}
