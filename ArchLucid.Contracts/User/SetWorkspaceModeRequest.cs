namespace ArchLucid.Contracts.User;

/// <summary>Request body for <c>PUT /v1/user/preferences/workspace-mode</c>.</summary>
public sealed class SetWorkspaceModeRequest
{
    public string Mode
    {
        get;
        set;
    } = WorkspaceModeValues.Default;
}
