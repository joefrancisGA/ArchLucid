namespace ArchLucid.Contracts.User;

/// <summary>Request body for <c>PUT /v1/user/preferences/professional-workbench</c>.</summary>
public sealed class SetProfessionalWorkbenchEnabledRequest
{
    public bool Enabled
    {
        get;
        set;
    }
}
