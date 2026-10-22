namespace ArchLucid.Application.Identity;

/// <summary>
///     Server-side commercial workspace caps (Free/trial = 1, Team/Pro from packaging).
///     Complements UI expansion nudges so create cannot bypass plan limits.
/// </summary>
public interface IWorkspacePackagingLimitEvaluator
{
    /// <summary>
    ///     Self-serve post-auth create provisions a new organization. Cap concurrent active
    ///     memberships so Free/trial users cannot farm a second workspace via this path.
    /// </summary>
    WorkspacePackagingLimitEvaluation EvaluateSelfServeOrganizationCreate(int activeMembershipCount);

    /// <summary>
    ///     Adding a workspace under an existing tenant — deny when used &gt;= plan limit.
    /// </summary>
    Task<WorkspacePackagingLimitEvaluation> EvaluateAdditionalWorkspaceForTenantAsync(
        Guid tenantId,
        CancellationToken cancellationToken);
}
