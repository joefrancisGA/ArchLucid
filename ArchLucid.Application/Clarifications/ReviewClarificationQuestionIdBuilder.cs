using System.Security.Cryptography;
using System.Text;

namespace ArchLucid.Application.Clarifications;

/// <summary>Stable question ids from finding type + normalized missing item (first 16 hex of SHA-256).</summary>
public static class ReviewClarificationQuestionIdBuilder
{
    public static string Build(string findingType, string missingItem)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(findingType);

        string normalizedMissingItem = NormalizeMissingItem(missingItem);
        string input = $"{findingType.Trim()}:{normalizedMissingItem}";
        byte[] hash = SHA256.HashData(Encoding.UTF8.GetBytes(input));

        return Convert.ToHexString(hash)[..16].ToLowerInvariant();
    }

    internal static string NormalizeMissingItem(string missingItem)
    {
        if (string.IsNullOrWhiteSpace(missingItem))
            return "(unspecified)";

        return missingItem.Trim().ToLowerInvariant();
    }
}
