using ArchLucid.Application.Identity;
using ArchLucid.Application.Tenancy;
using ArchLucid.Core.Admin;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Identity;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Admin;
using ArchLucid.Persistence.Identity;
using ArchLucid.Persistence.Tenancy;

using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Identity;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class PostAuthBootstrapServiceTests
{
    [Fact]
    public async Task ResolveStatusAsync_prioritizes_pending_invitation()
    {
        (PostAuthBootstrapService sut, Guid userId, _, InMemoryUserInvitationRepository invitations) = CreateSut();

        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();

        await invitations.InsertAsync(
            tenantId,
            workspaceId,
            "invited@example.com",
            ArchLucidRoles.Reader,
            "admin@test",
            null,
            EmailOtpInvitationTokenHasher.Hash("token"),
            DateTimeOffset.UtcNow.AddDays(7),
            CancellationToken.None);

        PostAuthBootstrapStatusResult status =
            await sut.ResolveStatusAsync(userId, "invited@example.com", "/", null, CancellationToken.None);

        Assert.Equal(PostAuthBootstrapDestination.AcceptInvitation, status.Destination);
    }

    [Fact]
    public async Task ResolveStatusAsync_selects_workspace_when_multiple_memberships()
    {
        (PostAuthBootstrapService sut, Guid userId, InMemoryWorkspaceMembershipRepository memberships, _) = CreateSut();

        await memberships.UpsertAsync(
            new WorkspaceMembershipInsert
            {
                UserId = userId,
                TenantId = Guid.NewGuid(),
                WorkspaceId = Guid.NewGuid(),
                Role = ArchLucidRoles.Reader,
                Status = WorkspaceMembershipStatus.Active
            },
            DateTimeOffset.UtcNow,
            CancellationToken.None);

        await memberships.UpsertAsync(
            new WorkspaceMembershipInsert
            {
                UserId = userId,
                TenantId = Guid.NewGuid(),
                WorkspaceId = Guid.NewGuid(),
                Role = ArchLucidRoles.Reader,
                Status = WorkspaceMembershipStatus.Active
            },
            DateTimeOffset.UtcNow,
            CancellationToken.None);

        PostAuthBootstrapStatusResult status =
            await sut.ResolveStatusAsync(userId, "ops@example.com", "/", null, CancellationToken.None);

        Assert.Equal(PostAuthBootstrapDestination.SelectWorkspace, status.Destination);
        Assert.Equal(2, status.Workspaces.Count);
    }

    [Fact]
    public async Task ResolveStatusAsync_offers_create_workspace_when_no_memberships()
    {
        (PostAuthBootstrapService sut, Guid userId, _, _) = CreateSut();

        PostAuthBootstrapStatusResult status =
            await sut.ResolveStatusAsync(userId, "new@example.com", "/", null, CancellationToken.None);

        Assert.Equal(PostAuthBootstrapDestination.CreateWorkspace, status.Destination);
        Assert.True(status.CanCreateWorkspace);
    }

    [Fact]
    public async Task CreateWorkspaceAsync_denies_when_data_region_not_in_supported_list()
    {
        Mock<IOptionsMonitor<TenantProvisioningOptions>> options = new();
        options
            .Setup(monitor => monitor.CurrentValue)
            .Returns(new TenantProvisioningOptions { SupportedDataRegions = ["default"] });

        Mock<ITenantProvisioningService> provisioning = new();
        PostAuthBootstrapService sut = CreateSut(
            new Mock<ITrialTenantBootstrapService>().Object,
            provisioning.Object,
            options.Object);

        PostAuthCreateWorkspaceResult result = await sut.CreateWorkspaceAsync(
            Guid.NewGuid(),
            "new@example.com",
            "new@example.com",
            new PostAuthCreateWorkspaceRequest
            {
                WorkspaceName = "Region Workspace",
                OrganizationName = "Region Org",
                TermsAccepted = true,
                DataRegion = "eastus",
            },
            CancellationToken.None);

        Assert.False(result.Succeeded);
        Assert.Contains("not in the supported list", result.CustomerMessage, StringComparison.OrdinalIgnoreCase);
        provisioning.Verify(
            service => service.ProvisionAsync(It.IsAny<TenantProvisioningRequest>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task CreateWorkspaceAsync_denies_when_industry_vertical_not_in_curated_list()
    {
        (PostAuthBootstrapService sut, Guid userId, _, _) = CreateSut();

        PostAuthCreateWorkspaceResult result = await sut.CreateWorkspaceAsync(
            userId,
            "new@example.com",
            "new@example.com",
            new PostAuthCreateWorkspaceRequest
            {
                WorkspaceName = "Invalid Vertical Workspace",
                OrganizationName = "Invalid Org",
                TermsAccepted = true,
                IndustryVertical = "Defense",
            },
            CancellationToken.None);

        Assert.False(result.Succeeded);
        Assert.Contains("curated list", result.CustomerMessage, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task CreateWorkspaceAsync_denies_when_other_vertical_without_other_specification()
    {
        (PostAuthBootstrapService sut, Guid userId, _, _) = CreateSut();

        PostAuthCreateWorkspaceResult result = await sut.CreateWorkspaceAsync(
            userId,
            "new@example.com",
            "new@example.com",
            new PostAuthCreateWorkspaceRequest
            {
                WorkspaceName = "Other Vertical Workspace",
                OrganizationName = "Other Org",
                TermsAccepted = true,
                IndustryVertical = "Other",
                IndustryVerticalOther = "   ",
            },
            CancellationToken.None);

        Assert.False(result.Succeeded);
        Assert.Contains("IndustryVerticalOther is required", result.CustomerMessage, StringComparison.Ordinal);
    }

    [Fact]
    public async Task CreateWorkspaceAsync_denies_without_terms()
    {
        (PostAuthBootstrapService sut, Guid userId, _, _) = CreateSut();

        PostAuthCreateWorkspaceResult result = await sut.CreateWorkspaceAsync(
            userId,
            "new@example.com",
            "new@example.com",
            new PostAuthCreateWorkspaceRequest
            {
                WorkspaceName = "Ops Workspace",
                OrganizationName = "Example Org",
                TermsAccepted = false
            },
            CancellationToken.None);

        Assert.False(result.Succeeded);
    }

    [Fact]
    public void WorkspaceNameValidator_rejects_script_markup()
    {
        bool ok = WorkspaceNameValidator.TryValidate("<script>", out _, out string message);

        Assert.False(ok);
        Assert.Contains("angle brackets", message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task ResolveStatusAsync_flags_email_mismatch_when_token_invitation_differs()
    {
        (PostAuthBootstrapService sut, Guid userId, _, InMemoryUserInvitationRepository invitations) = CreateSut();
        const string token = "mismatch-token";
        Guid tenantId = Guid.NewGuid();

        await invitations.InsertAsync(
            tenantId,
            Guid.NewGuid(),
            "invited@example.com",
            ArchLucidRoles.Reader,
            "admin@test",
            null,
            EmailOtpInvitationTokenHasher.Hash(token),
            DateTimeOffset.UtcNow.AddDays(7),
            CancellationToken.None);

        PostAuthBootstrapStatusResult status =
            await sut.ResolveStatusAsync(userId, "other@example.com", "/", token, CancellationToken.None);

        Assert.Equal(PostAuthBootstrapDestination.AcceptInvitation, status.Destination);
        Assert.Single(status.PendingInvitations);
        Assert.True(status.PendingInvitations[0].RequiresEmailMismatchConfirmation);
    }

    [Fact]
    public async Task AcceptInvitationAsync_requires_explicit_mismatch_confirmation()
    {
        (PostAuthBootstrapService sut, Guid userId, _, InMemoryUserInvitationRepository invitations) = CreateSut();
        const string token = "mismatch-accept";
        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();

        UserInvitationRecord row = await invitations.InsertAsync(
            tenantId,
            workspaceId,
            "invited@example.com",
            ArchLucidRoles.Reader,
            "admin@test",
            null,
            EmailOtpInvitationTokenHasher.Hash(token),
            DateTimeOffset.UtcNow.AddDays(7),
            CancellationToken.None);

        PostAuthBootstrapSessionResult? denied = await sut.AcceptInvitationAsync(
            userId,
            "other@example.com",
            new PostAuthAcceptInvitationRequest
            {
                InvitationId = row.Id,
                InvitationToken = token,
                ConfirmEmailMismatch = false
            },
            "/",
            CancellationToken.None);

        Assert.Null(denied);
    }

    [Fact]
    public async Task AcceptInvitationAsync_creates_membership_and_audits_on_success()
    {
        (PostAuthBootstrapService sut, Guid userId, InMemoryWorkspaceMembershipRepository memberships, InMemoryUserInvitationRepository invitations, _) =
            CreateSut(out Mock<IAuditService> audit);
        const string token = "accept-token";
        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();

        UserInvitationRecord row = await invitations.InsertAsync(
            tenantId,
            workspaceId,
            "invited@example.com",
            ArchLucidRoles.Reader,
            "admin@test",
            null,
            EmailOtpInvitationTokenHasher.Hash(token),
            DateTimeOffset.UtcNow.AddDays(7),
            CancellationToken.None);

        PostAuthBootstrapSessionResult? accepted = await sut.AcceptInvitationAsync(
            userId,
            "invited@example.com",
            new PostAuthAcceptInvitationRequest
            {
                InvitationId = row.Id,
                InvitationToken = token
            },
            "/runs/123",
            CancellationToken.None);

        Assert.NotNull(accepted);
        Assert.Equal(tenantId, accepted.TenantId);
        Assert.Equal(workspaceId, accepted.WorkspaceId);
        Assert.Equal("/runs/123", accepted.RedirectPath);

        IReadOnlyList<WorkspaceMembershipRecord> memberRows =
            await memberships.ListByUserIdAsync(userId, CancellationToken.None);

        Assert.Single(memberRows);
        Assert.Equal(ArchLucidRoles.Reader, memberRows[0].Role);

        audit.Verify(
            service => service.LogAsync(
                It.Is<AuditEvent>(evt => evt.EventType == AuditEventTypes.AdminUserInvitationAccepted),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task AcceptInvitationAsync_without_resume_path_redirects_to_first_review_guide()
    {
        (PostAuthBootstrapService sut, Guid userId, _, InMemoryUserInvitationRepository invitations) = CreateSut();
        const string token = "invite-default-redirect";
        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();

        UserInvitationRecord row = await invitations.InsertAsync(
            tenantId,
            workspaceId,
            "invited@example.com",
            ArchLucidRoles.Reader,
            "admin@test",
            null,
            EmailOtpInvitationTokenHasher.Hash(token),
            DateTimeOffset.UtcNow.AddDays(7),
            CancellationToken.None);

        PostAuthBootstrapSessionResult? accepted = await sut.AcceptInvitationAsync(
            userId,
            "invited@example.com",
            new PostAuthAcceptInvitationRequest
            {
                InvitationId = row.Id,
                InvitationToken = token
            },
            "/",
            CancellationToken.None);

        Assert.NotNull(accepted);
        Assert.Equal(PostAuthOperatorRoutes.InvitationAcceptedPath, accepted.RedirectPath);
    }

    [Fact]
    public async Task AcceptInvitationAsync_is_idempotent_when_user_already_member()
    {
        (PostAuthBootstrapService sut, Guid userId, InMemoryWorkspaceMembershipRepository memberships, InMemoryUserInvitationRepository invitations) = CreateSut();
        const string token = "existing-member";
        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();

        UserInvitationRecord row = await invitations.InsertAsync(
            tenantId,
            workspaceId,
            "member@example.com",
            ArchLucidRoles.Reader,
            "admin@test",
            null,
            EmailOtpInvitationTokenHasher.Hash(token),
            DateTimeOffset.UtcNow.AddDays(7),
            CancellationToken.None);

        await memberships.UpsertAsync(
            new WorkspaceMembershipInsert
            {
                UserId = userId,
                TenantId = tenantId,
                WorkspaceId = workspaceId,
                Role = ArchLucidRoles.Reader,
                Status = WorkspaceMembershipStatus.Active
            },
            DateTimeOffset.UtcNow,
            CancellationToken.None);

        PostAuthBootstrapSessionResult? accepted = await sut.AcceptInvitationAsync(
            userId,
            "member@example.com",
            new PostAuthAcceptInvitationRequest { InvitationId = row.Id, InvitationToken = token },
            "/",
            CancellationToken.None);

        Assert.NotNull(accepted);

        UserInvitationRecord? updated =
            await invitations.GetByIdAsync(tenantId, row.Id, CancellationToken.None);

        Assert.Equal(UserInvitationStatus.Accepted, updated!.Status);
    }

    [Fact]
    public async Task ResolveStatusAsync_completes_when_token_invitation_user_already_member()
    {
        (PostAuthBootstrapService sut, Guid userId, InMemoryWorkspaceMembershipRepository memberships, InMemoryUserInvitationRepository invitations) = CreateSut();
        const string token = "already-in";
        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();

        await invitations.InsertAsync(
            tenantId,
            workspaceId,
            "member@example.com",
            ArchLucidRoles.Reader,
            "admin@test",
            null,
            EmailOtpInvitationTokenHasher.Hash(token),
            DateTimeOffset.UtcNow.AddDays(7),
            CancellationToken.None);

        await memberships.UpsertAsync(
            new WorkspaceMembershipInsert
            {
                UserId = userId,
                TenantId = tenantId,
                WorkspaceId = workspaceId,
                Role = ArchLucidRoles.Reader,
                Status = WorkspaceMembershipStatus.Active
            },
            DateTimeOffset.UtcNow,
            CancellationToken.None);

        PostAuthBootstrapStatusResult status =
            await sut.ResolveStatusAsync(userId, "member@example.com", "/", token, CancellationToken.None);

        Assert.Equal(PostAuthBootstrapDestination.Complete, status.Destination);
    }

    private static (PostAuthBootstrapService sut, Guid userId, InMemoryWorkspaceMembershipRepository memberships, InMemoryUserInvitationRepository invitations) CreateSut()
    {
        (PostAuthBootstrapService sut, Guid userId, InMemoryWorkspaceMembershipRepository memberships, InMemoryUserInvitationRepository invitations, _) =
            CreateSut(out _);

        return (sut, userId, memberships, invitations);
    }

    private static PostAuthBootstrapService CreateSut(
        ITrialTenantBootstrapService trialBootstrap,
        ITenantProvisioningService provisioning,
        IOptionsMonitor<TenantProvisioningOptions>? tenantProvisioningOptions = null)
    {
        tenantProvisioningOptions ??= CreateDefaultTenantProvisioningOptions();
        InMemoryWorkspaceMembershipRepository memberships = new();
        InMemoryUserInvitationRepository invitations = new();
        InMemoryTenantRepository tenants = new();
        Mock<IEmailOtpSignInDomainPolicyService> domainPolicy = new();
        Mock<IAuditService> audit = new();

        domainPolicy
            .Setup(service => service.EvaluateAsync(It.IsAny<string>(), It.IsAny<string?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new EmailOtpSignInDomainEvaluation { Decision = EmailOtpSignInDomainDecision.AllowEmailOtp });

        Mock<ISelfServiceTrialAbusePolicy> abusePolicy = new();
        abusePolicy
            .Setup(policy =>
                policy.EvaluateAsync(It.IsAny<SelfServiceTrialAbuseEvaluationRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(SelfServiceTrialAbuseEvaluation.Allow());
        abusePolicy
            .Setup(policy => policy.RecordSuccessfulClaimAsync(
                It.IsAny<string>(),
                It.IsAny<Guid?>(),
                It.IsAny<Guid?>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        PostAuthInvitationBootstrapService invitationBootstrap = new(
            memberships,
            invitations,
            new UserInvitationFlowService(
                invitations,
                AuthSignInRoutingServiceTestSupport.Create(
                    new InMemoryTenantSignInEmailDomainRepository(),
                    new InMemoryTenantSignInEmailDomainRecoveryAdminRepository(),
                    new InMemoryTenantIdentityProviderConfigurationRepository(),
                    invitations,
                    new InMemoryPlatformTenantAuthRecoveryGrantRepository(),
                    TimeProvider.System),
                TimeProvider.System),
            tenants,
            audit.Object,
            TimeProvider.System);

        PostAuthWorkspaceBootstrapService workspaceBootstrap = new(
            memberships,
            tenants,
            provisioning,
            trialBootstrap,
            domainPolicy.Object,
            abusePolicy.Object,
            new WorkspacePackagingLimitEvaluator(Mock.Of<ITenantUsageStatusService>()),
            audit.Object,
            tenantProvisioningOptions,
            TimeProvider.System);

        return new PostAuthBootstrapService(memberships, invitationBootstrap, workspaceBootstrap);
    }

    private static (
        PostAuthBootstrapService sut,
        Guid userId,
        InMemoryWorkspaceMembershipRepository memberships,
        InMemoryUserInvitationRepository invitations,
        InMemoryTenantRepository tenants) CreateSut(
            out Mock<IAuditService> audit,
            ITenantRepository? tenantRepository = null,
            IWorkspacePackagingLimitEvaluator? packagingLimitEvaluator = null)
    {
        InMemoryWorkspaceMembershipRepository memberships = new();
        InMemoryUserInvitationRepository invitations = new();
        InMemoryTenantRepository tenants = tenantRepository as InMemoryTenantRepository ?? new InMemoryTenantRepository();
        ITenantRepository tenantStore = tenantRepository ?? tenants;
        Mock<ITenantProvisioningService> provisioning = new();
        Mock<ITrialTenantBootstrapService> trialBootstrap = new();
        Mock<IEmailOtpSignInDomainPolicyService> domainPolicy = new();
        audit = new Mock<IAuditService>();

        domainPolicy
            .Setup(service => service.EvaluateAsync(It.IsAny<string>(), It.IsAny<string?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new EmailOtpSignInDomainEvaluation { Decision = EmailOtpSignInDomainDecision.AllowEmailOtp });

        Guid userId = Guid.NewGuid();

        Mock<ISelfServiceTrialAbusePolicy> abusePolicy = new();
        abusePolicy
            .Setup(policy =>
                policy.EvaluateAsync(It.IsAny<SelfServiceTrialAbuseEvaluationRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(SelfServiceTrialAbuseEvaluation.Allow());
        abusePolicy
            .Setup(policy => policy.RecordSuccessfulClaimAsync(
                It.IsAny<string>(),
                It.IsAny<Guid?>(),
                It.IsAny<Guid?>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        PostAuthInvitationBootstrapService invitationBootstrap = new(
            memberships,
            invitations,
            new UserInvitationFlowService(
                invitations,
                AuthSignInRoutingServiceTestSupport.Create(
                    new InMemoryTenantSignInEmailDomainRepository(),
                    new InMemoryTenantSignInEmailDomainRecoveryAdminRepository(),
                    new InMemoryTenantIdentityProviderConfigurationRepository(),
                    invitations,
                    new InMemoryPlatformTenantAuthRecoveryGrantRepository(),
                    TimeProvider.System),
                TimeProvider.System),
            tenants,
            audit.Object,
            TimeProvider.System);

        PostAuthWorkspaceBootstrapService workspaceBootstrap = new(
            memberships,
            tenantStore,
            provisioning.Object,
            trialBootstrap.Object,
            domainPolicy.Object,
            abusePolicy.Object,
            packagingLimitEvaluator ?? new WorkspacePackagingLimitEvaluator(Mock.Of<ITenantUsageStatusService>()),
            audit.Object,
            CreateDefaultTenantProvisioningOptions(),
            TimeProvider.System);

        PostAuthBootstrapService sut = new(memberships, invitationBootstrap, workspaceBootstrap);

        return (sut, userId, memberships, invitations, tenants);
    }

    private static IOptionsMonitor<TenantProvisioningOptions> CreateDefaultTenantProvisioningOptions()
    {
        Mock<IOptionsMonitor<TenantProvisioningOptions>> options = new();
        options.Setup(monitor => monitor.CurrentValue).Returns(new TenantProvisioningOptions());

        return options.Object;
    }

    [Fact]
    public async Task LiveSeatLs004_single_membership_resolves_complete_destination()
    {
        (PostAuthBootstrapService sut, Guid userId, InMemoryWorkspaceMembershipRepository memberships, _) = CreateSut();
        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();

        await memberships.UpsertAsync(
            new WorkspaceMembershipInsert
            {
                UserId = userId,
                TenantId = tenantId,
                WorkspaceId = workspaceId,
                Role = ArchLucidRoles.Reader,
                Status = WorkspaceMembershipStatus.Active
            },
            DateTimeOffset.UtcNow,
            CancellationToken.None);

        PostAuthBootstrapStatusResult status =
            await sut.ResolveStatusAsync(userId, "member@example.com", "/", null, CancellationToken.None);

        Assert.Equal(PostAuthBootstrapDestination.Complete, status.Destination);
        Assert.Single(status.Workspaces);
        Assert.Equal(workspaceId, status.Workspaces[0].WorkspaceId);
        Assert.False(status.CanCreateWorkspace);
    }

    [Fact]
    public async Task LiveSeatLs019_accept_invitation_session_workspace_is_not_dev_default_scope()
    {
        (PostAuthBootstrapService sut, Guid userId, _, InMemoryUserInvitationRepository invitations) = CreateSut();
        const string token = "live-seat-invite-scope";
        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();

        UserInvitationRecord row = await invitations.InsertAsync(
            tenantId,
            workspaceId,
            "invited@example.com",
            ArchLucidRoles.Reader,
            "admin@test",
            null,
            EmailOtpInvitationTokenHasher.Hash(token),
            DateTimeOffset.UtcNow.AddDays(7),
            CancellationToken.None);

        PostAuthBootstrapSessionResult? accepted = await sut.AcceptInvitationAsync(
            userId,
            "invited@example.com",
            new PostAuthAcceptInvitationRequest
            {
                InvitationId = row.Id,
                InvitationToken = token
            },
            "/",
            CancellationToken.None);

        Assert.NotNull(accepted);
        Assert.Equal(workspaceId, accepted.WorkspaceId);
        Assert.NotEqual(ScopeIds.DefaultWorkspace, accepted.WorkspaceId);
    }

    [Fact]
    public async Task CreateWorkspaceAsync_strips_industry_vertical_other_when_vertical_is_not_other()
    {
        TrialSignupCompanyProfileCapture? capturedProfile = null;
        Mock<ITrialTenantBootstrapService> trialBootstrap = new();
        trialBootstrap
            .Setup(
                bootstrap => bootstrap.TryBootstrapAfterPostAuthWorkspaceAsync(
                    It.IsAny<TenantProvisioningResult>(),
                    It.IsAny<string>(),
                    It.IsAny<TrialSignupCompanyProfileCapture?>(),
                    It.IsAny<bool>(),
                    It.IsAny<CancellationToken>()))
            .Callback<TenantProvisioningResult, string, TrialSignupCompanyProfileCapture?, bool, CancellationToken>(
                (_, _, profile, _, _) => capturedProfile = profile)
            .Returns(Task.CompletedTask);

        Mock<ITenantProvisioningService> provisioning = new();
        Guid tenantId = Guid.NewGuid();
        provisioning
            .Setup(service => service.ProvisionAsync(It.IsAny<TenantProvisioningRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new TenantProvisioningResult
                {
                    TenantId = tenantId,
                    DefaultWorkspaceId = Guid.NewGuid(),
                    DefaultProjectId = Guid.NewGuid(),
                });

        PostAuthBootstrapService sut = CreateSut(trialBootstrap.Object, provisioning.Object);
        Guid userId = Guid.NewGuid();

        PostAuthCreateWorkspaceResult result = await sut.CreateWorkspaceAsync(
            userId,
            "new@example.com",
            "new@example.com",
            new PostAuthCreateWorkspaceRequest
            {
                WorkspaceName = "Healthcare Workspace",
                OrganizationName = "Healthcare Org",
                TermsAccepted = true,
                IndustryVertical = "Healthcare",
                IndustryVerticalOther = "should-not-persist",
            },
            CancellationToken.None);

        Assert.True(result.Succeeded);
        Assert.NotNull(capturedProfile);
        Assert.Equal("Healthcare", capturedProfile!.IndustryVertical);
        Assert.Null(capturedProfile.IndustryVerticalOther);
    }

    [Fact]
    public async Task CreateWorkspaceAsync_denies_when_owned_trial_active_status_differs_only_by_casing()
    {
        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Mock<ITenantRepository> tenantRepository = new();
        tenantRepository
            .Setup(repository => repository.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new TenantRecord
                {
                    Id = tenantId,
                    Name = "Existing Trial Org",
                    Slug = "existing-trial-org",
                    Tier = TenantTier.Standard,
                    DataRegion = TenantDataRegions.Default,
                    CreatedUtc = DateTimeOffset.UtcNow,
                    TrialStatus = "active",
                });

        Mock<IWorkspacePackagingLimitEvaluator> packaging = new();
        packaging
            .Setup(evaluator => evaluator.EvaluateSelfServeOrganizationCreate(It.IsAny<int>()))
            .Returns(WorkspacePackagingLimitEvaluation.Allow());
        packaging
            .Setup(evaluator => evaluator.EvaluateAdditionalWorkspaceForTenantAsync(
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(WorkspacePackagingLimitEvaluation.Allow());

        (PostAuthBootstrapService sut, Guid userId, InMemoryWorkspaceMembershipRepository memberships, _, _) =
            CreateSut(out _, tenantRepository.Object, packaging.Object);

        await memberships.UpsertAsync(
            new WorkspaceMembershipInsert
            {
                UserId = userId,
                TenantId = tenantId,
                WorkspaceId = workspaceId,
                Role = ArchLucidRoles.WorkspaceAdmin,
                Status = WorkspaceMembershipStatus.Active
            },
            DateTimeOffset.UtcNow,
            CancellationToken.None);

        PostAuthCreateWorkspaceResult result = await sut.CreateWorkspaceAsync(
            userId,
            "owner@example.com",
            "owner@example.com",
            new PostAuthCreateWorkspaceRequest
            {
                WorkspaceName = "Second",
                OrganizationName = "Second Org",
                TermsAccepted = true
            },
            CancellationToken.None);

        Assert.False(result.Succeeded);
        Assert.Contains("active evaluation workspace", result.CustomerMessage, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task CreateWorkspaceAsync_denies_when_workspace_packaging_limit_reached()
    {
        (PostAuthBootstrapService sut, Guid userId, InMemoryWorkspaceMembershipRepository memberships, _) = CreateSut();

        await memberships.UpsertAsync(
            new WorkspaceMembershipInsert
            {
                UserId = userId,
                TenantId = Guid.NewGuid(),
                WorkspaceId = Guid.NewGuid(),
                Role = ArchLucidRoles.WorkspaceAdmin,
                Status = WorkspaceMembershipStatus.Active
            },
            DateTimeOffset.UtcNow,
            CancellationToken.None);

        PostAuthCreateWorkspaceResult result = await sut.CreateWorkspaceAsync(
            userId,
            "owner@example.com",
            "owner@example.com",
            new PostAuthCreateWorkspaceRequest
            {
                WorkspaceName = "Second",
                OrganizationName = "Second Org",
                TermsAccepted = true
            },
            CancellationToken.None);

        Assert.False(result.Succeeded);
        Assert.Equal(WorkspacePackagingLimitEvaluator.SelfServeLimitCustomerMessage, result.CustomerMessage);
    }
}
