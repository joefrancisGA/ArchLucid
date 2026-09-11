namespace ArchLucid.Contracts.User;

/// <summary>Request body for <c>PUT /v1/user/preferences/working-career-rehearsal-door</c>.</summary>
public sealed class SetWorkingCareerRehearsalDoorRequest
{
    public string Door
    {
        get;
        set;
    } = WorkingCareerRehearsalDoorValues.Default;
}
