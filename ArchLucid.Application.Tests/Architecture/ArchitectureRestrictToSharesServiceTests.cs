using ArchLucid.Application.Architecture;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Persistence.ApplicationPorts.Architecture;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Architecture;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class ArchitectureRestrictToSharesServiceTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
        WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
        ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
    };

    private static readonly Guid ArchitectureId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
    private static readonly Guid ActorUserId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

    [Fact]
    public async Task SetAsync_enable_without_confirm_returns_confirmation_required()
    {
        Mock<IArchitectureIdentityRepository> identities = CreateIdentityMock();
        Mock<IArchitectureShareRepository> shares = new();

        ArchitectureRestrictToSharesService sut = new(identities.Object, shares.Object);

        ArchitectureRestrictToSharesSetResult result = await sut.SetAsync(
            Scope,
            ArchitectureId,
            restrictToShares: true,
            confirmOptIn: false,
            ActorUserId,
            "jwt:actor",
            CancellationToken.None);

        result.Status.Should().Be(ArchitectureRestrictToSharesSetStatus.ConfirmationRequired);
        shares.Verify(
            repository => repository.UpsertAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<ArchitectureShareRecord>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task SetAsync_enable_with_empty_share_list_bootstraps_actor_admin()
    {
        Mock<IArchitectureIdentityRepository> identities = CreateIdentityMock();
        Mock<IArchitectureShareRepository> shares = new();

        shares
            .Setup(repository => repository.CountByArchitectureIdAsync(Scope, ArchitectureId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(0);

        identities
            .Setup(repository => repository.TrySetRestrictToSharesAsync(
                Scope,
                ArchitectureId,
                true,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        ArchitectureRestrictToSharesService sut = new(identities.Object, shares.Object);

        ArchitectureRestrictToSharesSetResult result = await sut.SetAsync(
            Scope,
            ArchitectureId,
            restrictToShares: true,
            confirmOptIn: true,
            ActorUserId,
            "jwt:actor",
            CancellationToken.None);

        result.Status.Should().Be(ArchitectureRestrictToSharesSetStatus.Success);
        result.Response!.RestrictToShares.Should().BeTrue();
        result.Response.ActorAdminShareInserted.Should().BeTrue();

        shares.Verify(
            repository => repository.UpsertAsync(
                Scope,
                It.Is<ArchitectureShareRecord>(share =>
                    share.Role == ArchitectureShareRoles.Admin
                    && share.ActorOid == ArchitectureSharePlatformUserActorOid.FromUserId(ActorUserId)),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task SetAsync_disable_returns_workspace_visible_without_share_bootstrap()
    {
        Mock<IArchitectureIdentityRepository> identities = CreateIdentityMock();
        Mock<IArchitectureShareRepository> shares = new();

        identities
            .Setup(repository => repository.TrySetRestrictToSharesAsync(
                Scope,
                ArchitectureId,
                false,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        ArchitectureRestrictToSharesService sut = new(identities.Object, shares.Object);

        ArchitectureRestrictToSharesSetResult result = await sut.SetAsync(
            Scope,
            ArchitectureId,
            restrictToShares: false,
            confirmOptIn: false,
            Guid.Empty,
            "jwt:actor",
            CancellationToken.None);

        result.Status.Should().Be(ArchitectureRestrictToSharesSetStatus.Success);
        result.Response!.RestrictToShares.Should().BeFalse();
        result.Response.ActorAdminShareInserted.Should().BeFalse();
    }

    private static Mock<IArchitectureIdentityRepository> CreateIdentityMock()
    {
        Mock<IArchitectureIdentityRepository> identities = new();

        identities
            .Setup(repository => repository.GetByIdAsync(Scope, ArchitectureId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureIdentityRecord
            {
                ArchitectureId = ArchitectureId,
                DisplayName = "Platform",
            });

        return identities;
    }
}
