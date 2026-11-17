using System.Text;

namespace ArchLucid.Contracts.Metadata;

/// <summary>
///     Normalizes optional export metadata strings at persist, read, rehydrate, and diff boundaries.
/// </summary>
public static class OptionalExportMetadataStringNormalizer
{
    public static string? NormalizeOptionalString(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return null;

        string trimmed = value.Trim();
        string lineNormalized = trimmed
            .Replace("\r\n", "\n", StringComparison.Ordinal)
            .Replace("\r", "\n", StringComparison.Ordinal)
            .Replace('\u2028', '\n')
            .Replace('\u2029', '\n');

        return lineNormalized.Normalize(NormalizationForm.FormC);
    }
}
