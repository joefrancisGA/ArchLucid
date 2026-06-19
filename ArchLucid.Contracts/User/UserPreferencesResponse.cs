namespace ArchLucid.Contracts.User;

/// <summary>Response for <c>GET /v1/user/preferences</c>.</summary>
public sealed class UserPreferencesResponse
{
    public string AppearancePreference
    {
        get;
        set;
    } = AppearancePreferenceValues.Default;
}
