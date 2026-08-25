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
}
