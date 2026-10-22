using ArchLucid.Core.Tenancy;

namespace ArchLucid.Persistence.Tenancy;

/// <summary>Write guards for <c>dbo.TenantSettings</c> column limits (migration 173).</summary>
internal static class TenantSettingsWriteGuard
{
    public static void EnsureSettingValueLength(string settingValue)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(settingValue);

        if (settingValue.Trim().Length > TenantSettingsSchemaLimits.SettingValueMaxLength)
        {
            throw new ArgumentException(
                $"SettingValue must be at most {TenantSettingsSchemaLimits.SettingValueMaxLength} characters.",
                nameof(settingValue));
        }
    }
}
