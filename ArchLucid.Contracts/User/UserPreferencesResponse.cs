namespace ArchLucid.Contracts.User;

/// <summary>Response for <c>GET /v1/user/preferences</c>.</summary>
public sealed class UserPreferencesResponse
{
    public string AppearancePreference
    {
        get;
        set;
    } = AppearancePreferenceValues.Default;

    /// <summary>True when the user has an explicit stored appearance preference row.</summary>
    public bool AppearancePreferenceIsExplicit
    {
        get;
        set;
    }
}
