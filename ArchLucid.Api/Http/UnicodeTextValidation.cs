namespace ArchLucid.Api.Http;

/// <summary>Rejects lone Unicode surrogate code units on persisted controller free-text fields.</summary>
internal static class UnicodeTextValidation
{
    internal static bool IsValidUnicodeText(string? value)
    {
        if (string.IsNullOrEmpty(value))
            return true;

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
