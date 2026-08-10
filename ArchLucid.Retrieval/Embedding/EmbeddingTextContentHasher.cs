using System.Security.Cryptography;
using System.Text;

namespace ArchLucid.Retrieval.Embedding;

/// <summary>Stable SHA-256 hex of normalized UTF-8 text for embedding cache keys.</summary>
public static class EmbeddingTextContentHasher
{
    /// <summary>Normalizes newlines to LF, UTF-8 encodes, returns lowercase hex SHA-256.</summary>
    public static string Sha256HexUtf8Normalized(string text)
    {
        ArgumentNullException.ThrowIfNull(text);

        string normalized = text.Replace("\r\n", "\n", StringComparison.Ordinal).Replace('\r', '\n');
        byte[] utf8 = Encoding.UTF8.GetBytes(normalized);
        byte[] hash = SHA256.HashData(utf8);

        return Convert.ToHexString(hash).ToLowerInvariant();
    }
}
