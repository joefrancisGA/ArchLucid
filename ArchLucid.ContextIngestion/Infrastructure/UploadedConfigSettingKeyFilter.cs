namespace ArchLucid.ContextIngestion.Infrastructure;

/// <summary>
///     Skips secret-like uploaded config keys unless the value is a URL/host (SN-RT-09).
/// </summary>
internal static class UploadedConfigSettingKeyFilter
{
    private static readonly string[] RejectedKeySubstrings =
    [
        "__ApiKey",
        "Password",
        "Secret",
    ];

    public static bool ShouldSkipKey(string? key)
    {
        if (string.IsNullOrWhiteSpace(key))
        {
            return true;
        }

        string normalized = key.Trim();

        foreach (string rejected in RejectedKeySubstrings)
        {
            if (normalized.Contains(rejected, StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }
        }

        return false;
    }

    public static bool ShouldParseValueForRejectedKey(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return false;
        }

        string trimmed = value.Trim();

        return trimmed.StartsWith("http://", StringComparison.OrdinalIgnoreCase)
               || trimmed.StartsWith("https://", StringComparison.OrdinalIgnoreCase)
               || trimmed.Contains("Server=", StringComparison.OrdinalIgnoreCase)
               || trimmed.Contains("database.windows.net", StringComparison.OrdinalIgnoreCase);
    }
}
