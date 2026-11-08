using ArchLucid.Application.Identity;
using ArchLucid.Application.Tenancy;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Admin;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Identity;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Identity;

using FluentAssertions;

using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Identity;

[Trait("Category", "Unit")]
public sealed class PostAuthWorkspaceBootstrapServiceSelectTests
{
    private static readonly Guid TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static readonly Guid WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    private static readonly Guid UserId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");

    [Fact]
    public async Task SelectWorkspaceAsync_returns_null_when_workspace_list_is_null_instead_of_throwing()
    {
        InMemoryWorkspaceMembershipRepository memberships = new();
        await memberships.UpsertAsync(
            new WorkspaceMembershipInsert
            {
                UserId = UserId,
                TenantId = TenantId,
                WorkspaceId = WorkspaceId,
                Role = ArchLucidRoles.Reader,
                Status = WorkspaceMembershipStatus.Active,
            },
            DateTimeOffset.UtcNow,
            CancellationToken.None);

        Mock<ITenantRepository> tenants = new();
        tenants
            .Setup(repository => repository.ListWorkspacesAsync(TenantId, It.IsAny<CancellationToken>()))
            .Returns(Task.FromResult<IReadOnlyList<TenantWorkspaceListItem>>(null!));

        PostAuthWorkspaceBootstrapService sut = CreateSut(memberships, tenants.Object);

        PostAuthBootstrapSessionResult? result = await sut.SelectWorkspaceAsync(
            UserId,
            new PostAuthSelectWorkspaceRequest { TenantId = TenantId, WorkspaceId = WorkspaceId },
            "/",
            CancellationToken.None);

        result.Should().BeNull();
    }

    private static PostAuthWorkspaceBootstrapService CreateSut(
        IWorkspaceMembershipRepository memberships,
        ITenantRepository tenantRepository)
    {
        Mock<ITenantProvisioningService> provisioning = new();
        Mock<ITrialTenantBootstrapService> trialBootstrap = new();
        Mock<IEmailOtpSignInDomainPolicyService> domainPolicy = new();
        Mock<ISelfServiceTrialAbusePolicy> abusePolicy = new();
        Mock<IAuditService> audit = new();

        return new PostAuthWorkspaceBootstrapService(
            memberships,
            tenantRepository,
            provisioning.Object,
            trialBootstrap.Object,
            domainPolicy.Object,
            abusePolicy.Object,
            new WorkspacePackagingLimitEvaluator(Mock.Of<ITenantUsageStatusService>()),
            audit.Object,
            Mock.Of<IOptionsMonitor<TenantProvisioningOptions>>(monitor =>
                monitor.CurrentValue == new TenantProvisioningOptions()),
            TimeProvider.System);
    }
}
