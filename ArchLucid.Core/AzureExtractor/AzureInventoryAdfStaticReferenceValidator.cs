namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Validates static (non-expression) ADF reference names from ARM metadata.
/// </summary>
public static class AzureInventoryAdfStaticReferenceValidator
{
    public static bool IsStaticReferenceName(string? referenceName)
    {
        if (string.IsNullOrWhiteSpace(referenceName))
        {
            return false;
        }

        string trimmed = referenceName.Trim();

        if (trimmed.Contains('@', StringComparison.Ordinal)
            || trimmed.Contains("${", StringComparison.Ordinal)
            || trimmed.StartsWith("[", StringComparison.Ordinal))
        {
            return false;
        }

        return true;
    }
}
