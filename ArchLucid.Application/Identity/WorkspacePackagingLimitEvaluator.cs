using ArchLucid.Application.Tenancy;
using ArchLucid.Core.Billing;
using ArchLucid.Core.Tenancy;

namespace ArchLucid.Application.Identity;

public sealed class WorkspacePackagingLimitEvaluator(ITenantUsageStatusService usageStatus)
    : IWorkspacePackagingLimitEvaluator
{
    public const string SelfServeLimitCustomerMessage =
        "Your current plan includes one workspace. Select an existing workspace, or contact support to expand.";

    public const string TenantLimitCustomerMessage =
        "This organization has reached its workspace limit for the current plan. Upgrade or contact support to add another workspace.";

    private readonly ITenantUsageStatusService _usageStatus =
        usageStatus ?? throw new ArgumentNullException(nameof(usageStatus));

    public WorkspacePackagingLimitEvaluation EvaluateSelfServeOrganizationCreate(int activeMembershipCount)
    {
        if (activeMembershipCount < 0)
        {
            throw new ArgumentOutOfRangeException(nameof(activeMembershipCount));
        }

        int limit = CommercialPackagingLimits.FreeOrTrialWorkspacesIncluded;

        if (activeMembershipCount >= limit)
        {
            return WorkspacePackagingLimitEvaluation.Deny(
                SelfServeLimitCustomerMessage,
                "workspace_packaging_limit");
        }

        return WorkspacePackagingLimitEvaluation.Allow();
    }

    public async Task<WorkspacePackagingLimitEvaluation> EvaluateAdditionalWorkspaceForTenantAsync(
        Guid tenantId,
        CancellationToken cancellationToken)
    {
        if (tenantId == Guid.Empty)
        {
            throw new ArgumentException("Tenant id is required.", nameof(tenantId));
        }

        TenantUsageStatusSnapshot? snapshot =
            await _usageStatus.BuildAsync(tenantId, cancellationToken).ConfigureAwait(false);

        if (snapshot is null)
        {
            return WorkspacePackagingLimitEvaluation.Allow();
        }

        int limit = snapshot.WorkspacesLimit ?? CommercialPackagingLimits.FreeOrTrialWorkspacesIncluded;

        if (snapshot.WorkspacesUsed >= limit)
        {
            return WorkspacePackagingLimitEvaluation.Deny(
                TenantLimitCustomerMessage,
                "workspace_packaging_limit");
        }

        return WorkspacePackagingLimitEvaluation.Allow();
    }
}
