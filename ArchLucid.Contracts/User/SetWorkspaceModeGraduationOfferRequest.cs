namespace ArchLucid.Contracts.User;

/// <summary>Request body for <c>PUT /v1/user/preferences/workspace-mode-graduation-offer</c>.</summary>
public sealed class SetWorkspaceModeGraduationOfferRequest
{
    public string State
    {
        get;
        set;
    } = WorkspaceModeGraduationOfferValues.Default;
}
