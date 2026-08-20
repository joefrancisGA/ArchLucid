namespace ArchLucid.Contracts.User;

/// <summary>Request body for <c>PUT /v1/user/preferences/where-to-go-next</c>.</summary>
public sealed class SetWhereToGoNextVisibilityRequest
{
    public bool Enabled
    {
        get;
        set;
    } = true;
}
