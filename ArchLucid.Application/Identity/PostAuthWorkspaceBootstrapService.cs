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

public sealed class PostAuthWorkspaceBootstrapService(
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

    public async Task<PostAuthBootstrapStatusResult> ResolveWorkspaceStatusAsync(
        Guid platformUserId,
        string normalizedEmail,
        string? safeReturnPath,
        IReadOnlyList<WorkspaceMembershipRecord> activeMemberships,
        CancellationToken cancellationToken)
    {
        if (activeMemberships.Count > 1)
        {
            return new PostAuthBootstrapStatusResult
            {
                Destination = PostAuthBootstrapDestination.SelectWorkspace,
                Workspaces = await PostAuthBootstrapSupport.BuildWorkspaceSummariesAsync(
                        _tenantRepository,
                        activeMemberships,
                        cancellationToken)
                    .ConfigureAwait(false),
                CanCreateWorkspace = false
            };
        }

        if (activeMemberships.Count == 1)
        {
            if (PostAuthBootstrapSupport.IsResumePath(safeReturnPath))
            {
                return new PostAuthBootstrapStatusResult
                {
                    Destination = PostAuthBootstrapDestination.ResumeWorkflow,
                    ResumePath = safeReturnPath,
                    Workspaces = await PostAuthBootstrapSupport.BuildWorkspaceSummariesAsync(
                            _tenantRepository,
                            activeMemberships,
                            cancellationToken)
                        .ConfigureAwait(false),
                    CanCreateWorkspace = false
                };
            }

            return new PostAuthBootstrapStatusResult
            {
                Destination = PostAuthBootstrapDestination.Complete,
                Workspaces = await PostAuthBootstrapSupport.BuildWorkspaceSummariesAsync(
                        _tenantRepository,
                        activeMemberships,
                        cancellationToken)
                    .ConfigureAwait(false),
                CanCreateWorkspace = false
            };
        }

        PostAuthBootstrapDuplicateOrganizationHint duplicateHint =
            await EvaluateDuplicateOrganizationHintAsync(normalizedEmail, null, cancellationToken).ConfigureAwait(false);

        bool canCreate = !duplicateHint.AccessRequestRecommended
            && !await HasActiveOwnedTrialAsync(platformUserId, cancellationToken).ConfigureAwait(false);

        if (!canCreate && duplicateHint.AccessRequestRecommended)
        {
            return new PostAuthBootstrapStatusResult
            {
                Destination = PostAuthBootstrapDestination.NoAccess,
                DuplicateOrganization = duplicateHint,
                CanCreateWorkspace = false,
                DenialReason = duplicateHint.CustomerMessage
            };
        }

        if (!canCreate)
        {
            return new PostAuthBootstrapStatusResult
            {
                Destination = PostAuthBootstrapDestination.NoAccess,
                CanCreateWorkspace = false,
                DenialReason = ActiveTrialDenialMessage
            };
        }

        if (PostAuthBootstrapSupport.IsResumePath(safeReturnPath))
        {
            return new PostAuthBootstrapStatusResult
            {
                Destination = PostAuthBootstrapDestination.ResumeWorkflow,
                ResumePath = safeReturnPath,
                DuplicateOrganization = duplicateHint,
                CanCreateWorkspace = true
            };
        }

        return new PostAuthBootstrapStatusResult
        {
            Destination = PostAuthBootstrapDestination.CreateWorkspace,
            DuplicateOrganization = duplicateHint,
            CanCreateWorkspace = true
        };
    }

    public async Task<PostAuthCreateWorkspaceResult> CreateWorkspaceAsync(
        Guid platformUserId,
        string normalizedEmail,
        string displayEmail,
        PostAuthCreateWorkspaceRequest request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        PostAuthCreateWorkspaceResult? termsDenial =
            PostAuthTermsAttestationGate.DenyIfTermsNotAccepted(request.TermsAccepted);

        if (termsDenial is not null)
        {
            return termsDenial;
        }

        if (!WorkspaceNameValidator.TryValidate(request.WorkspaceName, out string workspaceName, out string workspaceMessage))
        {
            return AuthValidationResultMapper.ToPostAuthCreateWorkspaceDeny(
                AuthValidationResult.Invalid(workspaceMessage));
        }

        string organizationName = request.OrganizationName.Trim();

        if (organizationName.Length == 0)
        {
            organizationName = workspaceName;
        }

        if (organizationName.Length > 200)
        {
            return AuthValidationResultMapper.ToPostAuthCreateWorkspaceDeny(
                AuthValidationResult.Invalid("Organization name must be at most 200 characters."));
        }

        IReadOnlyList<WorkspaceMembershipRecord> activeMemberships =
            await PostAuthBootstrapSupport.ListActiveMembershipsAsync(_memberships, platformUserId, cancellationToken)
                .ConfigureAwait(false);

        WorkspacePackagingLimitEvaluation packagingLimit =
            _workspacePackagingLimitEvaluator.EvaluateSelfServeOrganizationCreate(activeMemberships.Count);

        if (!packagingLimit.Allowed)
        {
            await AuditDeniedAsync(
                    platformUserId,
                    displayEmail,
                    packagingLimit.DenyReasonCode ?? "workspace_packaging_limit",
                    cancellationToken)
                .ConfigureAwait(false);

            return AuthValidationResultMapper.ToPostAuthCreateWorkspaceDeny(
                AuthValidationResult.Invalid(
                    packagingLimit.CustomerMessage ?? WorkspacePackagingLimitEvaluator.SelfServeLimitCustomerMessage,
                    packagingLimit.DenyReasonCode ?? "workspace_packaging_limit"));
        }

        if (await HasActiveOwnedTrialAsync(platformUserId, cancellationToken).ConfigureAwait(false))
        {
            await AuditDeniedAsync(platformUserId, displayEmail, "active_trial", cancellationToken).ConfigureAwait(false);

            return AuthValidationResultMapper.ToPostAuthCreateWorkspaceDeny(
                AuthValidationResult.Invalid(ActiveTrialDenialMessage, "active_trial"));
        }

        SelfServiceTrialAbuseEvaluation abuseEvaluation = await _trialAbusePolicy.EvaluateAsync(
            new SelfServiceTrialAbuseEvaluationRequest
            {
                NormalizedEmail = normalizedEmail,
                InvitationToken = request.InvitationToken,
                PlatformUserId = platformUserId
            },
            cancellationToken).ConfigureAwait(false);

        if (!abuseEvaluation.Allowed)
        {
            await AuditDeniedAsync(platformUserId, displayEmail, abuseEvaluation.DenyReasonCode, cancellationToken)
                .ConfigureAwait(false);

            return AuthValidationResultMapper.ToPostAuthCreateWorkspaceDeny(
                AuthValidationResult.Invalid(abuseEvaluation.CustomerMessage, abuseEvaluation.DenyReasonCode));
        }

        PostAuthBootstrapDuplicateOrganizationHint duplicateHint =
            await EvaluateDuplicateOrganizationHintAsync(normalizedEmail, request.InvitationToken, cancellationToken)
                .ConfigureAwait(false);

        if (duplicateHint.AccessRequestRecommended)
        {
            await AuthAuditEmitter.LogAsync(
                    _auditService,
                    AuditEventTypes.PostAuthExistingOrganizationDetected,
                    displayEmail,
                    new { emailDomain = PostAuthBootstrapSupport.ExtractDomain(normalizedEmail) },
                    cancellationToken)
                .ConfigureAwait(false);

            return new PostAuthCreateWorkspaceResult
            {
                Succeeded = false,
                CustomerMessage = duplicateHint.CustomerMessage,
                DuplicateOrganization = duplicateHint
            };
        }

        EmailOtpSignInDomainEvaluation domainEvaluation =
            await _domainPolicy.EvaluateAsync(normalizedEmail, request.InvitationToken, cancellationToken)
                .ConfigureAwait(false);

        if (domainEvaluation.Decision == EmailOtpSignInDomainDecision.RequireEnterpriseSso)
        {
            await AuditDeniedAsync(platformUserId, displayEmail, "enterprise_sso_required", cancellationToken)
                .ConfigureAwait(false);

            return AuthValidationResultMapper.ToPostAuthCreateWorkspaceDeny(
                AuthValidationResult.Invalid(domainEvaluation.CustomerMessage, "enterprise_sso_required"));
        }

        TenantProvisioningResult provisioned = await _tenantProvisioning.ProvisionAsync(
            new TenantProvisioningRequest
            {
                Name = organizationName,
                AdminEmail = displayEmail,
                Tier = TenantTier.Standard,
                DataRegion = request.DataRegion ?? TenantDataRegions.Default,
                WorkspaceDisplayName = workspaceName,
                AuditActorOverride = displayEmail
            },
            cancellationToken).ConfigureAwait(false);

        if (provisioned.WasAlreadyProvisioned)
        {
            await AuthAuditEmitter.LogAsync(
                    _auditService,
                    AuditEventTypes.PostAuthExistingOrganizationDetected,
                    displayEmail,
                    new { organizationName = TenantOrganizationDuplicateDetector.NormalizeOrganizationName(organizationName) },
                    cancellationToken)
                .ConfigureAwait(false);

            return new PostAuthCreateWorkspaceResult
            {
                Succeeded = false,
                CustomerMessage = DuplicateOrgMessage,
                DuplicateOrganization = new PostAuthBootstrapDuplicateOrganizationHint
                {
                    Detected = true,
                    AccessRequestRecommended = true,
                    CustomerMessage = DuplicateOrgMessage
                }
            };
        }

        DateTimeOffset now = _timeProvider.GetUtcNow();

        await _memberships.UpsertAsync(
            new WorkspaceMembershipInsert
            {
                UserId = platformUserId,
                TenantId = provisioned.TenantId,
                WorkspaceId = provisioned.DefaultWorkspaceId,
                Role = ArchLucidRoles.WorkspaceAdmin,
                Status = WorkspaceMembershipStatus.Active
            },
            now,
            cancellationToken).ConfigureAwait(false);

        await AuthAuditEmitter.LogAsync(
                _auditService,
                AuditEventTypes.PostAuthWorkspaceCreated,
                displayEmail,
                new
                {
                    tenantId = provisioned.TenantId,
                    workspaceId = provisioned.DefaultWorkspaceId
                },
                cancellationToken,
                provisioned.TenantId)
            .ConfigureAwait(false);

        await AuthAuditEmitter.LogAsync(
                _auditService,
                AuditEventTypes.PostAuthInitialOwnerAssigned,
                displayEmail,
                new
                {
                    role = ArchLucidRoles.WorkspaceAdmin,
                    workspaceId = provisioned.DefaultWorkspaceId
                },
                cancellationToken,
                provisioned.TenantId)
            .ConfigureAwait(false);

        TrialSignupCompanyProfileCapture? companyProfile = BuildCompanyProfile(request);

        await _trialBootstrap.TryBootstrapAfterPostAuthWorkspaceAsync(
            provisioned,
            displayEmail,
            companyProfile,
            request.IncludeDemoSeed,
            cancellationToken).ConfigureAwait(false);

        await _trialAbusePolicy.RecordSuccessfulClaimAsync(
            normalizedEmail,
            platformUserId,
            provisioned.TenantId,
            "post_auth_bootstrap",
            cancellationToken).ConfigureAwait(false);

        string onboardingPath = BuildOnboardingPath(request.IndustryVertical);

        return new PostAuthCreateWorkspaceResult
        {
            Succeeded = true,
            TenantId = provisioned.TenantId,
            WorkspaceId = provisioned.DefaultWorkspaceId,
            ProjectId = provisioned.DefaultProjectId,
            OnboardingPath = onboardingPath
        };
    }

    public async Task<PostAuthBootstrapSessionResult?> SelectWorkspaceAsync(
        Guid platformUserId,
        PostAuthSelectWorkspaceRequest request,
        string? safeReturnPath,
        CancellationToken cancellationToken)
    {
        IReadOnlyList<WorkspaceMembershipRecord> membershipsForUser =
            await _memberships.ListByUserAndTenantAsync(platformUserId, request.TenantId, cancellationToken)
                .ConfigureAwait(false);

        WorkspaceMembershipRecord? membership = membershipsForUser.FirstOrDefault(row =>
            row.WorkspaceId == request.WorkspaceId && row.Status == WorkspaceMembershipStatus.Active);

        if (membership is null)
        {
            return null;
        }

        IReadOnlyList<TenantWorkspaceListItem> workspaces =
            await _tenantRepository.ListWorkspacesAsync(request.TenantId, cancellationToken).ConfigureAwait(false);

        TenantWorkspaceListItem? workspace = workspaces.FirstOrDefault(row => row.WorkspaceId == request.WorkspaceId);

        if (workspace is null)
        {
            return null;
        }

        return new PostAuthBootstrapSessionResult
        {
            TenantId = request.TenantId,
            WorkspaceId = request.WorkspaceId,
            ProjectId = workspace.DefaultProjectId,
            Role = membership.Role,
            RedirectPath = PostAuthBootstrapSupport.IsResumePath(safeReturnPath) ? safeReturnPath! : "/"
        };
    }

    private async Task<bool> HasActiveOwnedTrialAsync(Guid platformUserId, CancellationToken cancellationToken)
    {
        IReadOnlyList<WorkspaceMembershipRecord> memberships =
            await PostAuthBootstrapSupport.ListActiveMembershipsAsync(_memberships, platformUserId, cancellationToken)
                .ConfigureAwait(false);

        foreach (WorkspaceMembershipRecord membership in memberships)
        {
            if (!string.Equals(membership.Role, ArchLucidRoles.WorkspaceAdmin, StringComparison.Ordinal)
                && !string.Equals(membership.Role, ArchLucidRoles.Admin, StringComparison.Ordinal))
            {
                continue;
            }

            TenantRecord? tenant =
                await _tenantRepository.GetByIdAsync(membership.TenantId, cancellationToken).ConfigureAwait(false);

            if (tenant is not null
                && string.Equals(tenant.TrialStatus, TrialLifecycleStatus.Active, StringComparison.Ordinal))
            {
                return true;
            }
        }

        return false;
    }

    private async Task<PostAuthBootstrapDuplicateOrganizationHint> EvaluateDuplicateOrganizationHintAsync(
        string normalizedEmail,
        string? invitationToken,
        CancellationToken cancellationToken)
    {
        EmailOtpSignInDomainEvaluation domainEvaluation =
            await _domainPolicy.EvaluateAsync(normalizedEmail, invitationToken, cancellationToken).ConfigureAwait(false);

        if (domainEvaluation.Decision == EmailOtpSignInDomainDecision.RequireEnterpriseSso)
        {
            return new PostAuthBootstrapDuplicateOrganizationHint
            {
                Detected = true,
                AccessRequestRecommended = true,
                CustomerMessage = DuplicateOrgMessage
            };
        }

        return new PostAuthBootstrapDuplicateOrganizationHint
        {
            Detected = false,
            AccessRequestRecommended = false,
            CustomerMessage = string.Empty
        };
    }

    private static TrialSignupCompanyProfileCapture? BuildCompanyProfile(PostAuthCreateWorkspaceRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.IndustryVertical))
        {
            return null;
        }

        return new TrialSignupCompanyProfileCapture(
            null,
            null,
            request.IndustryVertical.Trim(),
            request.IndustryVerticalOther?.Trim());
    }

    private static string BuildOnboardingPath(string? industryVertical) =>
        PostAuthOperatorRoutes.BuildBootstrapCompletePath(industryVertical);

    private async Task AuditDeniedAsync(
        Guid platformUserId,
        string displayEmail,
        string reason,
        CancellationToken cancellationToken)
    {
        await AuthAuditEmitter.LogAsync(
                _auditService,
                AuditEventTypes.PostAuthWorkspaceCreationDenied,
                displayEmail,
                new { reason },
                cancellationToken)
            .ConfigureAwait(false);
    }
}
