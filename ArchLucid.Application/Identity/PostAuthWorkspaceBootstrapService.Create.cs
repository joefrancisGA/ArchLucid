using ArchLucid.Application.Tenancy;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Identity;
using ArchLucid.Core.Tenancy;

namespace ArchLucid.Application.Identity;

public sealed partial class PostAuthWorkspaceBootstrapService
{
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
}
