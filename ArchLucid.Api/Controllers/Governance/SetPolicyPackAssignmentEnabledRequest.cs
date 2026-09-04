namespace ArchLucid.Api.Controllers.Governance;

/// <summary>Body for <c>PUT /v1/policy-packs/assignments/{assignmentId}/enabled</c>.</summary>
public sealed class SetPolicyPackAssignmentEnabledRequest
{
    public required bool IsEnabled
    {
        get;
        set;
    }
}
