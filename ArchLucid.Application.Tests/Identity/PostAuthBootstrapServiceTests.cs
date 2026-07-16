using ArchLucid.Application.Identity;
using ArchLucid.Application.Tenancy;
using ArchLucid.Core.Admin;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Identity;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Admin;
using ArchLucid.Persistence.Identity;
using ArchLucid.Persistence.Tenancy;

using Moq;

namespace ArchLucid.Application.Tests.Identity;

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
            await sut.ResolveStatusAsync(userId, "invited@example.com", "/", CancellationToken.None);

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
            await sut.ResolveStatusAsync(userId, "ops@example.com", "/", CancellationToken.None);

        Assert.Equal(PostAuthBootstrapDestination.SelectWorkspace, status.Destination);
        Assert.Equal(2, status.Workspaces.Count);
    }

    [Fact]
    public async Task ResolveStatusAsync_offers_create_workspace_when_no_memberships()
    {
        (PostAuthBootstrapService sut, Guid userId, _, _) = CreateSut();

        PostAuthBootstrapStatusResult status =
            await sut.ResolveStatusAsync(userId, "new@example.com", "/", CancellationToken.None);

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

    private static (PostAuthBootstrapService sut, Guid userId, InMemoryWorkspaceMembershipRepository memberships, InMemoryUserInvitationRepository invitations) CreateSut()
    {
        InMemoryWorkspaceMembershipRepository memberships = new();
        InMemoryUserInvitationRepository invitations = new();
        InMemoryTenantRepository tenants = new();
        Mock<ITenantProvisioningService> provisioning = new();
        Mock<ITrialTenantBootstrapService> trialBootstrap = new();
        Mock<IEmailOtpSignInDomainPolicyService> domainPolicy = new();
        Mock<IAuditService> audit = new();

        domainPolicy
            .Setup(service => service.EvaluateAsync(It.IsAny<string>(), It.IsAny<string?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new EmailOtpSignInDomainEvaluation { Decision = EmailOtpSignInDomainDecision.AllowEmailOtp });

        Guid userId = Guid.NewGuid();

        PostAuthBootstrapService sut = new(
            memberships,
            invitations,
            tenants,
            provisioning.Object,
            trialBootstrap.Object,
            domainPolicy.Object,
            audit.Object,
            TimeProvider.System);

        return (sut, userId, memberships, invitations);
    }
}
