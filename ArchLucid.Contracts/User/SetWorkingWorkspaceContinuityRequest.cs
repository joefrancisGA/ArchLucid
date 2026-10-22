namespace ArchLucid.Contracts.User;

/// <summary>Request body for <c>PUT /v1/user/preferences/working-workspace-continuity</c>.</summary>
public sealed class SetWorkingWorkspaceContinuityRequest
{
    public WorkingWorkspaceContinuityDto Continuity
    {
        get;
        set;
    } = WorkingWorkspaceContinuityValues.Default;
}
