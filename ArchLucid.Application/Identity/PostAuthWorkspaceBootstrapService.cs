using ArchLucid.Application.Tenancy;
using ArchLucid.Core.Admin;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Identity;
using ArchLucid.Core.Tenancy;

namespace ArchLucid.Application.Identity;

public interface IPostAuthWorkspaceBootstrapService
{
    Task<PostAuthBootstrapStatusResult> ResolveWorkspaceStatusAsync(
        Guid platformUserId,
        string normalizedEmail,
        string? safeReturnPath,
        IReadOnlyList<WorkspaceMembershipRecord> activeMemberships,
        CancellationToken cancellationToken);

    Task<PostAuthCreateWorkspaceResult> CreateWorkspaceAsync(
        Guid platformUserId,
        string normalizedEmail,
        string displayEmail,
        PostAuthCreateWorkspaceRequest request,
        CancellationToken cancellationToken);

    Task<PostAuthBootstrapSessionResult?> SelectWorkspaceAsync(
        Guid platformUserId,
        PostAuthSelectWorkspaceRequest request,
        string? safeReturnPath,
        CancellationToken cancellationToken);
}

public sealed partial class PostAuthWorkspaceBootstrapService(
    IWorkspaceMembershipRepository memberships,
    ITenantRepository tenantRepository,
    ITenantProvisioningService tenantProvisioning,
    ITrialTenantBootstrapService trialBootstrap,
    IEmailOtpSignInDomainPolicyService domainPolicy,
    ISelfServiceTrialAbusePolicy trialAbusePolicy,
    IWorkspacePackagingLimitEvaluator workspacePackagingLimitEvaluator,
    IAuditService auditService,
    TimeProvider timeProvider) : IPostAuthWorkspaceBootstrapService
{
    private const string DuplicateOrgMessage =
        "An organization with this name or email domain may already use ArchLucid. Request access instead of creating a duplicate workspace.";

    private const string ActiveTrialDenialMessage =
        "You already have an active evaluation workspace. Sign in to continue or contact support for another organization.";

    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    private readonly IEmailOtpSignInDomainPolicyService _domainPolicy =
        domainPolicy ?? throw new ArgumentNullException(nameof(domainPolicy));

    private readonly ISelfServiceTrialAbusePolicy _trialAbusePolicy =
        trialAbusePolicy ?? throw new ArgumentNullException(nameof(trialAbusePolicy));

    private readonly IWorkspacePackagingLimitEvaluator _workspacePackagingLimitEvaluator =
        workspacePackagingLimitEvaluator ?? throw new ArgumentNullException(nameof(workspacePackagingLimitEvaluator));

    private readonly IWorkspaceMembershipRepository _memberships =
        memberships ?? throw new ArgumentNullException(nameof(memberships));

    private readonly ITenantProvisioningService _tenantProvisioning =
        tenantProvisioning ?? throw new ArgumentNullException(nameof(tenantProvisioning));

    private readonly ITenantRepository _tenantRepository =
        tenantRepository ?? throw new ArgumentNullException(nameof(tenantRepository));

    private readonly ITrialTenantBootstrapService _trialBootstrap =
        trialBootstrap ?? throw new ArgumentNullException(nameof(trialBootstrap));

    private readonly TimeProvider _timeProvider =
        timeProvider ?? throw new ArgumentNullException(nameof(timeProvider));
}
