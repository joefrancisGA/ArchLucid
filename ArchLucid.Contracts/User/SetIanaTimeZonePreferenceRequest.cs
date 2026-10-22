namespace ArchLucid.Contracts.User;

/// <summary>Request body for <c>PUT /v1/user/preferences/time-zone</c>.</summary>
public sealed class SetIanaTimeZonePreferenceRequest
{
    public string? IanaTimeZoneId
    {
        get;
        set;
    }
}
