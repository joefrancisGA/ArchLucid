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

        return value.Trim().Normalize(NormalizationForm.FormC);
    }
}
