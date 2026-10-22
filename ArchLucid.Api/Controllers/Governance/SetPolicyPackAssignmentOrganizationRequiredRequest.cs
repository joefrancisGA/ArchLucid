namespace ArchLucid.Api.Controllers.Governance;

/// <summary>Body for <c>PUT /v1/policy-packs/assignments/{assignmentId}/organization-required</c>.</summary>
public sealed class SetPolicyPackAssignmentOrganizationRequiredRequest
{
    public required bool IsOrganizationRequired
    {
        get;
        set;
    }
}
