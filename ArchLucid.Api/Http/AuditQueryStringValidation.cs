namespace ArchLucid.Api.Http;

/// <summary>Guards audit list/search query strings against fuzz inputs that can break storage or serialization.</summary>
internal static class AuditQueryStringValidation
{
    private const int MaxFilterTextLength = 256;

    internal static bool TryValidateOptionalFilterText(string? value, out string? errorMessage)
    {
        errorMessage = null;

        if (string.IsNullOrEmpty(value))
            return true;

        if (value.Length > MaxFilterTextLength)
        {
            errorMessage = $"Filter values must be {MaxFilterTextLength} characters or fewer.";
            return false;
        }

        if (!IsValidUnicodeText(value))
        {
            errorMessage = "Filter values must be valid Unicode text.";
            return false;
        }

        return true;
    }

    private static bool IsValidUnicodeText(string value)
    {
        for (int i = 0; i < value.Length; i++)
        {
            if (!char.IsSurrogate(value[i]))
                continue;

            if (i + 1 >= value.Length || !char.IsSurrogatePair(value[i], value[i + 1]))
                return false;

            i++;
        }

        return true;
    }
}
