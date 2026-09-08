namespace ArchLucid.Persistence.Tenancy;

/// <summary>Write guards for <c>dbo.TenantSettings</c> column limits (migration 173).</summary>
internal static class TenantSettingsWriteGuard
{
    public const int SettingValueMaxLength = 512;

    public static void EnsureSettingValueLength(string settingValue)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(settingValue);

        if (settingValue.Trim().Length > SettingValueMaxLength)
        {
            throw new ArgumentException(
                $"SettingValue must be at most {SettingValueMaxLength} characters.",
                nameof(settingValue));
        }
    }
}
