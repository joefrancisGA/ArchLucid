using System.Security.Cryptography;
using System.Text;

namespace ArchLucid.ContextIngestion.Parsing;

/// <summary>
///     Builds collision-resistant display names for long ingested line/requirement text.
/// </summary>
public static class ContextIngestionStableLineNames
{
    public static string BuildDisplayName(string text, int maxPrefixLength = 80)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(text);

        if (text.Length <= maxPrefixLength)
            return text;

        string prefix = text[..maxPrefixLength];
        string suffix = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(text)).AsSpan(0, 4)).ToLowerInvariant();

        return $"{prefix}#{suffix}";
    }

    /// <summary>
    ///     Deterministic <see cref="ArchLucid.Contracts.Persistence.Context.CanonicalObject.ObjectId" />
    ///     for document-parsed non-topology lines so graph materialization stays stable across re-parse.
    /// </summary>
    public static string StableObjectId(string objectType, string canonicalText)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(objectType);
        ArgumentException.ThrowIfNullOrWhiteSpace(canonicalText);

        string material = $"{objectType}:{canonicalText}";
        byte[] hash = SHA256.HashData(Encoding.UTF8.GetBytes(material));

        return Convert.ToHexString(hash.AsSpan(0, 16)).ToLowerInvariant();
    }
}
