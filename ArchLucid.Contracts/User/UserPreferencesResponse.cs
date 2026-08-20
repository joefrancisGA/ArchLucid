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

    public CloudPlatformScopeDto CloudPlatformScope
    {
        get;
        set;
    } = CloudPlatformScopeValues.Default;

    /// <summary>True when the user has an explicit stored cloud-platform scope row.</summary>
    public bool CloudPlatformScopeIsExplicit
    {
        get;
        set;
    }

    /// <summary>When false, operator follow-up strips titled Where to go next are hidden.</summary>
    public bool WhereToGoNextEnabled
    {
        get;
        set;
    } = true;

    /// <summary>True when the user has an explicit stored Where to go next visibility row.</summary>
    public bool WhereToGoNextIsExplicit
    {
        get;
        set;
    }
}
