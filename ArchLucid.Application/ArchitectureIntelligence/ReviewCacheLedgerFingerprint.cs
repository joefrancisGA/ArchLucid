using System.Security.Cryptography;
using System.Text;
using ArchLucid.Contracts.Persistence.TechnologyLedger;
using ArchLucid.Core.Persistence.Graph;

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
                     .ThenBy(item => item.IsLocked)
                     .DistinctBy(FormatLedgerEntryFingerprint, StringComparer.Ordinal))
        {
            builder.Append(FormatLedgerEntryFingerprint(entry)).Append('\n');
        }

        return Sha256Hex(builder.ToString());
    }

    private static string FormatLedgerEntryFingerprint(TechnologyLedgerEntry entry) =>
        string.Join(
            '|',
            entry.Role.ToString(),
            NormalizeTechnologyName(entry.TechnologyName),
            entry.ProviderFamily.ToString(),
            entry.Status.ToString(),
            entry.Source.ToString(),
            entry.IsLocked ? '1' : '0',
            NormalizeEvidenceRef(entry.EvidenceRef));

    private static string NormalizeTechnologyName(string? technologyName)
    {
        if (string.IsNullOrWhiteSpace(technologyName))
            return string.Empty;

        string normalized = CollapseInteriorAsciiSpaces(NormalizeUnicodeSpaces(technologyName.Trim())).Normalize(NormalizationForm.FormC);

        return GraphSnapshotCanonicalFingerprint.NormalizeReviewCachePathLikeToken(normalized.ToLowerInvariant());
    }

    private static string NormalizeEvidenceRef(string? evidenceRef)
    {
        if (string.IsNullOrWhiteSpace(evidenceRef))
            return string.Empty;

        string normalized = CollapseInteriorAsciiSpaces(NormalizeUnicodeSpaces(evidenceRef.Trim())).Normalize(NormalizationForm.FormC);

        return GraphSnapshotCanonicalFingerprint.NormalizeReviewCachePathLikeToken(normalized.ToLowerInvariant());
    }

    private static string NormalizeUnicodeSpaces(string value) =>
        value
            .Replace('\u00a0', ' ')
            .Replace('\u202f', ' ');

    private static string CollapseInteriorAsciiSpaces(string content)
    {
        while (content.Contains("  ", StringComparison.Ordinal))
            content = content.Replace("  ", " ", StringComparison.Ordinal);

        return content;
    }

    private static string Sha256Hex(string value)
    {
        byte[] bytes = SHA256.HashData(Encoding.UTF8.GetBytes(value));

        return Convert.ToHexString(bytes).ToLowerInvariant();
    }
}
