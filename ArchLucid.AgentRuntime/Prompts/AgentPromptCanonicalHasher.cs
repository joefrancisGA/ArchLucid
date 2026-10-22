using System.Security.Cryptography;
using System.Text;

namespace ArchLucid.AgentRuntime.Prompts;

/// <summary>
///     Canonical hashing for prompt templates: normalize newlines so Git/Windows vs Linux does not change the fingerprint,
///     then SHA-256 over UTF-8.
/// </summary>
public static class AgentPromptCanonicalHasher
{
    /// <summary>Lowercase hex SHA-256 of <paramref name="text" /> after newline canonicalization.</summary>
    public static string Sha256HexUtf8Normalized(string text)
    {
        ArgumentNullException.ThrowIfNull(text);
        string normalized = text.Replace("\r\n", "\n", StringComparison.Ordinal).Replace('\r', '\n');
        byte[] utf8 = Encoding.UTF8.GetBytes(normalized);
        byte[] hash = SHA256.HashData(utf8);

        return Convert.ToHexStringLower(hash);
    }

    /// <summary>First 16 lowercase hex characters of the canonical SHA-256 fingerprint.</summary>
    public static string ContentHashPrefix16(string text) =>
        ContentHashPrefix16FromSha256Hex(Sha256HexUtf8Normalized(text));

    /// <summary>First 16 lowercase hex characters of a full SHA-256 hex digest.</summary>
    public static string ContentHashPrefix16FromSha256Hex(string sha256Hex)
    {
        ArgumentException.ThrowIfNullOrEmpty(sha256Hex);

        return sha256Hex.Length <= 16
            ? sha256Hex.ToLowerInvariant()
            : sha256Hex[..16].ToLowerInvariant();
    }
}
