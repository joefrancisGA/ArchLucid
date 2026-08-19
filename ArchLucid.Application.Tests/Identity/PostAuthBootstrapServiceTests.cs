using ArchLucid.Application.Identity;
using ArchLucid.Application.Tenancy;
using ArchLucid.Core.Admin;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Identity;
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
        (PostAuthBootstrapService sut, Guid userId, InMemoryWorkspaceMembershipRepository memberships, InMemoryUserInvitationRepository invitations) = CreateSut(out Mock<IAuditService> audit);
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

    private static (PostAuthBootstrapService sut, Guid userId, InMemoryWorkspaceMembershipRepository memberships, InMemoryUserInvitationRepository invitations) CreateSut() =>
        CreateSut(out _);

    private static (PostAuthBootstrapService sut, Guid userId, InMemoryWorkspaceMembershipRepository memberships, InMemoryUserInvitationRepository invitations) CreateSut(out Mock<IAuditService> audit)
    {
        InMemoryWorkspaceMembershipRepository memberships = new();
        InMemoryUserInvitationRepository invitations = new();
        InMemoryTenantRepository tenants = new();
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

        PostAuthBootstrapService sut = new(
            memberships,
            invitations,
            new UserInvitationFlowService(
                invitations,
                new AuthSignInRoutingService(
                    new InMemoryTenantSignInEmailDomainRepository(),
                    new InMemoryTenantSignInEmailDomainRecoveryAdminRepository(),
                    new InMemoryTenantIdentityProviderConfigurationRepository(),
                    invitations,
                    new InMemoryPlatformTenantAuthRecoveryGrantRepository(),
                    TimeProvider.System),
                TimeProvider.System),
            tenants,
            provisioning.Object,
            trialBootstrap.Object,
            domainPolicy.Object,
            abusePolicy.Object,
            new WorkspacePackagingLimitEvaluator(Mock.Of<ITenantUsageStatusService>()),
            audit.Object,
            TimeProvider.System);

        return (sut, userId, memberships, invitations);
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
