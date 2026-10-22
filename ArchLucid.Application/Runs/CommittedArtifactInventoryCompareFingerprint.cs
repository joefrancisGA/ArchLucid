using System.Security.Cryptography;
using System.Text;

using ArchLucid.Core.Manifest.Sections;

namespace ArchLucid.Application.Runs;

/// <summary>
///     Wave-15 suggestion 145: deterministic inventory fingerprint for compare output.
/// </summary>
public static class CommittedArtifactInventoryCompareFingerprint
{
    public static string? ComputeHashSha256(IReadOnlyList<CommittedArtifactInventoryEntry>? rows)
    {
        if (rows is null || rows.Count == 0)
            return null;

        string canonical = string.Join(
            '|',
            rows
                .OrderBy(static row => row.ArtifactName, StringComparer.Ordinal)
                .Select(static row => $"{row.ArtifactName}:{row.ContentHashSha256}"));

        return Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(canonical)));
    }
}
