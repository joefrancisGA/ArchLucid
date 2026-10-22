namespace ArchLucid.Contracts.User;

/// <summary>Request body for <c>PUT /v1/user/preferences/appearance</c>.</summary>
public sealed class SetAppearancePreferenceRequest
{
    public string Value
    {
        get;
        set;
    } = AppearancePreferenceValues.Default;
}
