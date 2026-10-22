using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;

namespace ArchLucid.Application.Architecture;

/// <summary>Cross-session content fingerprints for Quick Scan abuse detection (TB-897).</summary>
public static partial class QuickScanContentFingerprint
{
    /// <summary>SHA-256 hex of normalized description — never includes session or raw unnormalized text as the key.</summary>
    public static string Compute(string description)
    {
        string normalized = Normalize(description);
        byte[] hash = SHA256.HashData(Encoding.UTF8.GetBytes(normalized));

        return Convert.ToHexString(hash).ToLowerInvariant();
    }

    public static string Normalize(string description)
    {
        if (string.IsNullOrWhiteSpace(description))
            return string.Empty;

        string collapsed = WhitespaceCollapseRegex().Replace(description.Trim().ToLowerInvariant(), " ");

        return collapsed;
    }

    [GeneratedRegex(@"\s+")]
    private static partial Regex WhitespaceCollapseRegex();
}
