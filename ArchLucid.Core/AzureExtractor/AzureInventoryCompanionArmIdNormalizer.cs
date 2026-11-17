using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Core.AzureExtractor;

/// <summary>Normalizes bounded, possibly repeatedly encoded companion ARM identifiers.</summary>
internal static class AzureInventoryCompanionArmIdNormalizer
{
    private const int MaxEncodedInputLength = 16 * 1024;

    public const int MaxIdentifierLength = 512;

    public static bool TryNormalize(string? value, out string normalized)
    {
        normalized = string.Empty;

        if (string.IsNullOrWhiteSpace(value))
        {
            return false;
        }

        string trimmed = value.Trim();

        if (trimmed.Length > MaxEncodedInputLength)
        {
            return false;
        }

        string decoded = PercentDecodeBounded.Decode(trimmed);
        string armId = ArmResourceIdNormalizer.Normalize(decoded);

        if (armId.Length == 0)
        {
            return false;
        }

        normalized = armId.Length > MaxIdentifierLength
            ? armId[..MaxIdentifierLength]
            : armId;

        return true;
    }
}
