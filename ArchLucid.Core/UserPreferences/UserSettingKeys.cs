namespace ArchLucid.Core.UserPreferences;

/// <summary>Well-known <c>dbo.UserSettings.PreferenceKey</c> values.</summary>
public static class UserSettingKeys
{
    /// <summary>User appearance preference: <c>system</c>, <c>light</c>, or <c>dark</c>.</summary>
    public const string AppearancePreference = "AppearancePreference";

    /// <summary>JSON blob of personal cloud-platform visibility toggles.</summary>
    public const string CloudPlatformScope = "CloudPlatformScope";

    /// <summary>Whether Where to go next follow-up strips are shown: <c>true</c> or <c>false</c>.</summary>
    public const string WhereToGoNextEnabled = "WhereToGoNextEnabled";
}
