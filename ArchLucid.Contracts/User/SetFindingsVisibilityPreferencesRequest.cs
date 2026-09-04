namespace ArchLucid.Contracts.User;

/// <summary>Request body for <c>PUT /v1/user/preferences/findings-visibility</c>.</summary>
public sealed class SetFindingsVisibilityPreferencesRequest
{
    public bool HideGenericEnabled
    {
        get;
        set;
    }

    public bool ShowLowConfidenceEnabled
    {
        get;
        set;
    }

    public bool ShowAdvisoryEnabled
    {
        get;
        set;
    }
}
