namespace ArchLucid.Persistence.Tenancy;

/// <summary>
///     Normalizes <c>dbo.TenantSettings.SettingKey</c> for storage and cache keys (trim + case-insensitive).
/// </summary>
internal static class TenantSettingKeyNormalizer
{
    public static string Normalize(string settingKey)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(settingKey);

        return settingKey.Trim().ToLowerInvariant();
    }
}
