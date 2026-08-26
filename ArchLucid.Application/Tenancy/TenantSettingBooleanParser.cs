namespace ArchLucid.Application.Tenancy;

internal static class TenantSettingBooleanParser
{
    internal static bool TryParse(string? raw, out bool value)
    {
        value = false;

        if (string.IsNullOrWhiteSpace(raw))
        {
            return false;
        }

        return bool.TryParse(raw.Trim(), out value);
    }

    internal static string Format(bool value) => value ? "true" : "false";
}
