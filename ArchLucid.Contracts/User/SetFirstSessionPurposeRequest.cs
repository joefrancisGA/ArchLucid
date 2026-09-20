namespace ArchLucid.Contracts.User;

/// <summary>Request body for <c>PUT /v1/user/preferences/first-session-purpose</c>.</summary>
public sealed class SetFirstSessionPurposeRequest
{
    public string Purpose
    {
        get;
        set;
    } = FirstSessionPurposeValues.Live;
}
