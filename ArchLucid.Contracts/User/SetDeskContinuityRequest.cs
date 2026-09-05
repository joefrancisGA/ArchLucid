namespace ArchLucid.Contracts.User;

/// <summary>Request body for <c>PUT /v1/user/preferences/desk-continuity</c>.</summary>
public sealed class SetDeskContinuityRequest
{
    public DeskContinuityDto Continuity
    {
        get;
        set;
    } = DeskContinuityValues.Default;
}
