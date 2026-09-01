using ArchLucid.Application.Authorization;
using ArchLucid.Application.Common;
using ArchLucid.Application.Governance;
using ArchLucid.Application.Tenancy;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Authorization;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class WorkOwnershipDeleteAuthorizationServiceTests
{
    [Fact]
    public async Task EnsureCanDeleteOwnedWorkAsync_allows_tenant_administrator()
    {
        WorkOwnershipDeleteAuthorizationService service = CreateService(
            isTenantAdministrator: true,
            allowCreatorDelete: false,
            actorId: "jwt:other");

        Func<Task> act = () => service.EnsureCanDeleteOwnedWorkAsync("jwt:creator", CancellationToken.None);

        await act.Should().NotThrowAsync();
    }

    [Fact]
    public async Task EnsureCanDeleteOwnedWorkAsync_allows_creator_when_policy_enabled()
    {
        WorkOwnershipDeleteAuthorizationService service = CreateService(
            isTenantAdministrator: false,
            allowCreatorDelete: true,
            actorId: "jwt:tenant:creator");

        Func<Task> act = () => service.EnsureCanDeleteOwnedWorkAsync("jwt:tenant:creator", CancellationToken.None);

        await act.Should().NotThrowAsync();
    }

    [Fact]
    public async Task EnsureCanDeleteOwnedWorkAsync_blocks_non_creator_when_policy_enabled()
    {
        WorkOwnershipDeleteAuthorizationService service = CreateService(
            isTenantAdministrator: false,
            allowCreatorDelete: true,
            actorId: "jwt:tenant:operator");

        Func<Task> act = () => service.EnsureCanDeleteOwnedWorkAsync("jwt:tenant:creator", CancellationToken.None);

        await act.Should().ThrowAsync<WorkOwnershipDeleteForbiddenException>();
    }

    [Fact]
    public async Task EnsureCanDeleteOwnedWorkAsync_blocks_creator_when_policy_disabled()
    {
        WorkOwnershipDeleteAuthorizationService service = CreateService(
            isTenantAdministrator: false,
            allowCreatorDelete: false,
            actorId: "jwt:tenant:creator");

        Func<Task> act = () => service.EnsureCanDeleteOwnedWorkAsync("jwt:tenant:creator", CancellationToken.None);

        await act.Should().ThrowAsync<WorkOwnershipDeleteForbiddenException>();
    }

    private static WorkOwnershipDeleteAuthorizationService CreateService(
        bool isTenantAdministrator,
        bool allowCreatorDelete,
        string actorId)
    {
        Mock<IActorContext> actor = new();
        actor.Setup(a => a.GetActor()).Returns(actorId);
        actor.Setup(a => a.GetActorId()).Returns(actorId);
        actor.Setup(a => a.TryGetSubmitterMailbox()).Returns((string?)null);

        Mock<ICallerRoleAccessor> roles = new();
        roles.Setup(r => r.IsTenantAdministrator()).Returns(isTenantAdministrator);

        Mock<ITenantWorkOwnershipDeletePolicyService> policy = new();
        policy
            .Setup(p => p.GetAllowCreatorDeleteOwnedWorkAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(allowCreatorDelete);

        return new WorkOwnershipDeleteAuthorizationService(actor.Object, roles.Object, policy.Object);
    }
}
