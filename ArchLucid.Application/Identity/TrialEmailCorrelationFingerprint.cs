using System.Security.Cryptography;
using System.Text;

namespace ArchLucid.Application.Identity;

/// <summary>
///     Produces a short, stable hex prefix for correlating trial-email diagnostics without logging raw addresses.
/// </summary>
public static class TrialEmailCorrelationFingerprint
{
    private const int HexPrefixLength = 12;

    /// <summary>
    ///     Returns the leading lowercase hex digits of SHA-256(UTF-8(<see cref="TrialEmailNormalizer.Normalize" />(email))).
    /// </summary>
    public static string ComputeHexPrefix(string email)
    {
        ArgumentNullException.ThrowIfNull(email);

        string normalized = TrialEmailNormalizer.Normalize(email);
        byte[] hash = SHA256.HashData(Encoding.UTF8.GetBytes(normalized));
        string hex = Convert.ToHexString(hash).ToLowerInvariant();

        return hex.Length <= HexPrefixLength ? hex : hex[..HexPrefixLength];
    }
}
