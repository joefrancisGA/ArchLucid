using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Core.AzureExtractor;

/// <summary>Normalizes companion ARM resource identifiers (percent-decode + ARM-ID normalize).</summary>
internal static class CompanionArmIdNormalizer
{
    /// <summary>
    ///     Trims, bounded percent-decodes via <see cref="PercentDecodeBounded.Decode" />, then ARM-normalizes via
    ///     <see cref="ArmResourceIdNormalizer.Normalize" />. Returns <see cref="string.Empty" /> for null,
    ///     empty, or whitespace input.
    /// </summary>
    public static string Normalize(string? armId)
    {
        if (string.IsNullOrWhiteSpace(armId))
        {
            return string.Empty;
        }

        string working = PercentDecodeBounded.Decode(armId.Trim());

        return ArmResourceIdNormalizer.Normalize(working);
    }
}
